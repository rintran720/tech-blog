"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Settings, XCircle, FileText } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    posts: number;
  };
}

export default function AdminTagsPage() {
  const { data: session } = useSession();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    color: "#EF7A43",
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/admin/tags");
      const data = await response.json();
      setTags(data.tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    try {
      const response = await fetch("/api/admin/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsCreateOpen(false);
        resetForm();
        fetchTags();
      } else {
        try {
          const data = await response.json();
          console.error("Error creating tag:", data.error);
        } catch (jsonError) {
          console.error("Error parsing response:", jsonError);
          console.error("Response status:", response.status);
          console.error("Response text:", await response.text());
        }
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleUpdateTag = async () => {
    if (!selectedTag) return;

    try {
      const response = await fetch(`/api/admin/tags/${selectedTag.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsEditOpen(false);
        resetForm();
        fetchTags();
      } else {
        try {
          const data = await response.json();
          console.error("Error updating tag:", data.error);
        } catch (jsonError) {
          console.error("Error parsing response:", jsonError);
          console.error("Response status:", response.status);
          console.error("Response text:", await response.text());
        }
      }
    } catch (error) {
      console.error("Error updating tag:", error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thẻ này?")) return;

    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTags();
      } else {
        const data = await response.json();
        console.error("Error deleting tag:", data.error);
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      color: "#EF7A43",
    });
    setSelectedTag(null);
  };

  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
      color: tag.color || "#EF7A43",
    });
    setIsEditOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Quản lý thẻ</h1>
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
        <h1 className="text-3xl font-bold">Quản lý thẻ</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Tạo thẻ mới
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Tạo thẻ mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên thẻ</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nhập tên thẻ..."
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
                  placeholder="slug-the"
                />
              </div>
              <div>
                <Label htmlFor="color">Màu sắc</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color || "#EF7A43"}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.color || "#EF7A43"}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#EF7A43"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="default"
                  onClick={handleCreateTag}
                >
                  Tạo thẻ
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên thẻ</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Màu sắc</TableHead>
                <TableHead>Bài viết</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có thẻ nào.
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow
                    key={tag.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <TableCell>
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {tag.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-highlight/10 text-highlight"
                      >
                        {tag.slug}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-border"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {tag.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-highlight/10 rounded-full flex items-center justify-center">
                          <FileText className="h-3 w-3 text-highlight" />
                        </div>
                        <span className="text-sm">
                          {tag._count?.posts || 0} bài viết
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tag.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(tag)}
                          title="Chỉnh sửa"
                          className="hover:bg-highlight/10 hover:text-highlight"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag.id)}
                          title="Xóa thẻ"
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thẻ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên thẻ</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên thẻ..."
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
                placeholder="slug-the"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Màu sắc</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color || "#EF7A43"}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.color || "#EF7A43"}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#EF7A43"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Hủy
              </Button>
              <Button
                variant="default"
                onClick={handleUpdateTag}
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
