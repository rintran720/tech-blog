"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  User,
  Tag,
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  hotScore: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  tags: {
    id: string;
    name: string;
    slug: string;
    color: string;
  }[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export default function AdminPostsPage() {
  useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    published: false,
    hotScore: 0,
    tagIds: [] as string[],
  });
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search: searchTerm,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/posts?${params}`);
      const data = await response.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/tags");
      const data = await response.json();
      setTags(data.tags);
      setAvailableTags(data.tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }, []);

  const createTag = async (name: string) => {
    try {
      const response = await fetch("/api/admin/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTag = data.tag;

        // Update available tags
        setAvailableTags([...availableTags, newTag]);
        setTags([...tags, newTag]);

        // Add to selected tags
        setFormData({
          ...formData,
          tagIds: [...formData.tagIds, newTag.id],
        });

        // Reset new tag input
        setNewTagName("");
        setShowNewTagInput(false);

        return newTag;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create tag");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      alert(
        `Lỗi tạo tag: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  };

  const handleCreatePost = async () => {
    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsCreateOpen(false);
        resetForm();
        fetchPosts();
      } else {
        const data = await response.json();
        console.error("Error creating post:", data.error);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost) return;

    try {
      const response = await fetch(`/api/admin/posts/${selectedPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsEditOpen(false);
        resetForm();
        fetchPosts();
      } else {
        const data = await response.json();
        console.error("Error updating post:", data.error);
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPosts();
      } else {
        const data = await response.json();
        console.error("Error deleting post:", data.error);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      published: false,
      hotScore: 0,
      tagIds: [],
    });
    setSelectedPost(null);
    setNewTagName("");
    setShowNewTagInput(false);
  };

  const openEditDialog = (post: Post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      published: post.published,
      hotScore: post.hotScore || 0,
      tagIds: post.tags.map((tag) => tag.id),
    });
    setNewTagName("");
    setShowNewTagInput(false);
    setIsEditOpen(true);
  };

  const openViewDialog = (post: Post) => {
    setSelectedPost(post);
    setIsViewOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Quản lý bài viết</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý bài viết</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài viết mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo bài viết mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Nhập tiêu đề bài viết..."
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="slug-bai-viet"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="excerpt">Tóm tắt</Label>
                <Input
                  id="excerpt"
                  value={formData.excerpt || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  placeholder="Nhập tóm tắt bài viết..."
                />
              </div>
              <div>
                <Label htmlFor="content">Nội dung</Label>
                <MarkdownEditor
                  value={formData.content}
                  onChange={(value) =>
                    setFormData({ ...formData, content: value || "" })
                  }
                />
              </div>
              <div>
                <Label htmlFor="hotScore">Hot Score</Label>
                <Input
                  id="hotScore"
                  type="number"
                  min="0"
                  value={formData.hotScore || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hotScore: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Thẻ</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTagInput(!showNewTagInput)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tạo tag mới
                  </Button>
                </div>

                {showNewTagInput && (
                  <div className="mb-3 p-3 border rounded-md bg-muted/30">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập tên tag mới..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTagName.trim()) {
                            createTag(newTagName.trim());
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newTagName.trim()) {
                            createTag(newTagName.trim());
                          }
                        }}
                        disabled={!newTagName.trim()}
                      >
                        Tạo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowNewTagInput(false);
                          setNewTagName("");
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {availableTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.tagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                tagIds: [...formData.tagIds, tag.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                tagIds: formData.tagIds.filter(
                                  (id) => id !== tag.id
                                ),
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Đã chọn {formData.tagIds.length} thẻ
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        published: e.target.checked,
                      })
                    }
                  />
                  <span>Đã xuất bản</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Hủy
                </Button>
                <Button variant="default" onClick={handleCreatePost}>
                  Tạo bài viết
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "published" | "draft")
              }
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tất cả</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hot Score</TableHead>
                <TableHead>Thẻ</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không có bài viết nào.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow
                    key={post.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <TableCell>
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {post.title}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {post.excerpt}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">
                          {post.author.name || post.author.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Đã xuất bản" : "Bản nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {post.hotScore || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {post.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(post.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(post)}
                          title="Xem chi tiết"
                          className="hover:bg-highlight/10 hover:text-highlight"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {post.published && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(`/blog/${post.slug}`, "_blank")
                            }
                            title="Xem trang"
                            className="hover:bg-highlight/10 hover:text-highlight"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(post)}
                          title="Chỉnh sửa"
                          className="hover:bg-highlight/10 hover:text-highlight"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          title="Xóa"
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Tiêu đề</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nhập tiêu đề bài viết..."
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="slug-bai-viet"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-excerpt">Tóm tắt</Label>
              <Input
                id="edit-excerpt"
                value={formData.excerpt || ""}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder="Nhập tóm tắt bài viết..."
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Nội dung</Label>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData({ ...formData, content: value || "" })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-hotScore">Hot Score</Label>
              <Input
                id="edit-hotScore"
                type="number"
                min="0"
                value={formData.hotScore || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hotScore: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Thẻ</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewTagInput(!showNewTagInput)}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Tạo tag mới
                </Button>
              </div>

              {showNewTagInput && (
                <div className="mb-3 p-3 border rounded-md bg-muted/30">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập tên tag mới..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newTagName.trim()) {
                          createTag(newTagName.trim());
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (newTagName.trim()) {
                          createTag(newTagName.trim());
                        }
                      }}
                      disabled={!newTagName.trim()}
                    >
                      Tạo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewTagInput(false);
                        setNewTagName("");
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              )}

              <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {availableTags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.tagIds.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              tagIds: [...formData.tagIds, tag.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              tagIds: formData.tagIds.filter(
                                (id) => id !== tag.id
                              ),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Đã chọn {formData.tagIds.length} thẻ
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                />
                <span>Đã xuất bản</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Hủy
              </Button>
              <Button variant="default" onClick={handleUpdatePost}>
                Cập nhật
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>
              Tác giả: {selectedPost?.author.name || selectedPost?.author.email}{" "}
              • Ngày tạo: {selectedPost && formatDate(selectedPost.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPost && <MarkdownViewer content={selectedPost.content} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
