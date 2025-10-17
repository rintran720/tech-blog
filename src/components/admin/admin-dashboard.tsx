"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  FileText,
  MessageSquare,
  Tag,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  Shield,
  Settings,
  Key,
  Home,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { PostsManagement } from "./posts-management";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface AdminDashboardProps {
  readonly user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string; // Serialized as ISO string
    updatedAt: string; // Serialized as ISO string
    roleId: string | null;
    role: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      permissions: string[]; // Array of permission strings
      createdAt: string; // Serialized as ISO string
      updatedAt: string; // Serialized as ISO string
      isActive: boolean;
      isSystem: boolean;
    } | null;
  };
}

interface Stats {
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  totalTags: number;
  publishedPosts: number;
  draftPosts: number;
  approvedComments: number;
  pendingComments: number;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  approved: boolean;
  createdAt: string;
  post: {
    title: string;
    slug: string;
  };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: {
    posts: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  _count?: {
    posts: number;
    comments: number;
  };
  role?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isSystem: boolean;
  _count?: {
    users: number;
  };
  users: {
    id: string;
    name?: string | null;
    email?: string | null;
  }[];
}

interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states for Tags Management
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isEditTagDialogOpen, setIsEditTagDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagFormData, setTagFormData] = useState({
    name: "",
    slug: "",
  });

  // Dialog states for Users Management
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRoleFormData, setUserRoleFormData] = useState({
    roleId: "",
  });

  // Dialog states for Permissions Management
  const [isCreatePermissionOpen, setIsCreatePermissionOpen] = useState(false);
  const [isEditPermissionDialogOpen, setIsEditPermissionDialogOpen] =
    useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [permissionFormData, setPermissionFormData] = useState({
    name: "",
    slug: "",
    description: "",
    resource: "",
    action: "",
  });

  // Dialog states for Roles Management
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isRolePermissionsDialogOpen, setIsRolePermissionsDialogOpen] =
    useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const menuItems = [
    {
      id: "overview",
      label: "Tổng quan",
      icon: BarChart3,
      description: "Thống kê tổng quan",
    },
    {
      id: "posts",
      label: "Bài viết",
      icon: FileText,
      description: "Quản lý bài viết",
    },
    {
      id: "comments",
      label: "Bình luận",
      icon: MessageSquare,
      description: "Duyệt bình luận",
    },
    {
      id: "tags",
      label: "Thẻ",
      icon: Tag,
      description: "Quản lý thẻ",
    },
    {
      id: "users",
      label: "Người dùng",
      icon: Users,
      description: "Quản lý người dùng",
    },
    {
      id: "permissions",
      label: "Quyền",
      icon: Key,
      description: "Quản lý quyền",
    },
    {
      id: "role-management",
      label: "Vai trò",
      icon: Shield,
      description: "Quản lý vai trò và quyền",
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Fetch comments
      const commentsRes = await fetch("/api/admin/comments");
      const commentsData = await commentsRes.json();
      setComments(commentsData.comments);

      // Fetch tags
      const tagsRes = await fetch("/api/admin/tags");
      const tagsData = await tagsRes.json();
      setTags(tagsData.tags);

      // Fetch users
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      setUsers(usersData.users);

      // Fetch roles
      const rolesRes = await fetch("/api/admin/roles");
      const rolesData = await rolesRes.json();
      setRoles(rolesData);

      // Fetch permissions
      const permissionsRes = await fetch("/api/admin/permissions");
      const permissionsData = await permissionsRes.json();
      setPermissions(permissionsData.permissions);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveComment = async (commentId: string) => {
    try {
      await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved: true }),
      });
      fetchData(); // Re-fetch data to update the list
    } catch (error) {
      console.error("Error approving comment:", error);
    }
  };

  const handleRejectComment = async (commentId: string) => {
    try {
      await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved: false }),
      });
      fetchData(); // Re-fetch data to update the list
    } catch (error) {
      console.error("Error rejecting comment:", error);
    }
  };

  // Tag management functions
  const handleCreateTag = async () => {
    try {
      const response = await fetch("/api/admin/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tagFormData),
      });

      if (response.ok) {
        setIsTagDialogOpen(false);
        resetTagForm();
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error creating tag:", data.error);
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
        body: JSON.stringify(tagFormData),
      });

      if (response.ok) {
        setIsEditTagDialogOpen(false);
        resetTagForm();
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error updating tag:", data.error);
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
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error deleting tag:", data.error);
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const resetTagForm = () => {
    setTagFormData({
      name: "",
      slug: "",
    });
    setSelectedTag(null);
  };

  const openEditTagDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setTagFormData({
      name: tag.name,
      slug: tag.slug,
    });
    setIsEditTagDialogOpen(true);
  };

  // User role management functions
  const handleAssignUserRole = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userRoleFormData),
      });

      if (response.ok) {
        setIsUserRoleDialogOpen(false);
        resetUserRoleForm();
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error assigning role:", data.error);
      }
    } catch (error) {
      console.error("Error assigning role:", error);
    }
  };

  const resetUserRoleForm = () => {
    setUserRoleFormData({
      roleId: "",
    });
    setSelectedUser(null);
  };

  // Permission Management Functions
  const handleCreatePermission = async () => {
    try {
      const response = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permissionFormData),
      });

      if (response.ok) {
        setIsCreatePermissionOpen(false);
        resetPermissionForm();
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error creating permission:", data.error);
      }
    } catch (error) {
      console.error("Error creating permission:", error);
    }
  };

  const handleUpdatePermission = async () => {
    if (!selectedPermission) return;

    try {
      const response = await fetch(
        `/api/admin/permissions/${selectedPermission.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(permissionFormData),
        }
      );

      if (response.ok) {
        setIsEditPermissionDialogOpen(false);
        resetPermissionForm();
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error updating permission:", data.error);
      }
    } catch (error) {
      console.error("Error updating permission:", error);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa quyền này?")) return;

    try {
      const response = await fetch(`/api/admin/permissions/${permissionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error deleting permission:", data.error);
      }
    } catch (error) {
      console.error("Error deleting permission:", error);
    }
  };

  const resetPermissionForm = () => {
    setPermissionFormData({
      name: "",
      slug: "",
      description: "",
      resource: "",
      action: "",
    });
    setSelectedPermission(null);
  };

  const openEditPermissionDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setPermissionFormData({
      name: permission.name,
      slug: permission.slug,
      description: permission.description || "",
      resource: permission.resource,
      action: permission.action,
    });
    setIsEditPermissionDialogOpen(true);
  };

  // Role Management Functions
  const handleCreateRole = async () => {
    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleFormData),
      });

      if (response.ok) {
        setIsCreateRoleOpen(false);
        resetRoleForm();
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error creating role:", data.error);
      }
    } catch (error) {
      console.error("Error creating role:", error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleFormData),
      });

      if (response.ok) {
        setIsEditRoleDialogOpen(false);
        resetRoleForm();
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error updating role:", data.error);
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vai trò này?")) return;

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error deleting role:", data.error);
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: "",
      slug: "",
      description: "",
    });
    setSelectedRole(null);
  };

  const openEditRoleDialog = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || "",
    });
    setIsEditRoleDialogOpen(true);
  };

  const openRolePermissionsDialog = async (role: Role) => {
    setSelectedRole(role);

    // Fetch current role permissions
    try {
      const response = await fetch(`/api/admin/roles/${role.id}/permissions`);
      const data = await response.json();
      setRolePermissions(data.permissions || []);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      setRolePermissions([]);
    }

    setIsRolePermissionsDialogOpen(true);
  };

  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(
        `/api/admin/roles/${selectedRole.id}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions: rolePermissions }),
        }
      );

      if (response.ok) {
        setIsRolePermissionsDialogOpen(false);
        setSelectedRole(null);
        setRolePermissions([]);
        fetchData();
      } else {
        const data = await response.json();
        console.error("Error updating role permissions:", data.error);
      }
    } catch (error) {
      console.error("Error updating role permissions:", error);
    }
  };

  const openUserRoleDialog = (user: User) => {
    setSelectedUser(user);
    setUserRoleFormData({
      roleId: user.role?.id || "",
    });
    setIsUserRoleDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Xin chào,{" "}
              <span className="font-medium text-foreground">{user.name}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 border-r bg-background/50 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-75 truncate">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : (
              <>
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Tổng bài viết
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats?.totalPosts || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Tổng bình luận
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats?.totalComments || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Tổng người dùng
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats?.totalUsers || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Tổng thẻ
                        </CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats?.totalTags || 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Bình luận gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {comments?.slice(0, 5).map((comment) => (
                          <div
                            key={comment.id}
                            className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                          >
                            <div className="flex-1">
                              <p className="text-sm">{comment.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {comment.author?.name || "Không có tên"} •{" "}
                                {formatDate(comment.createdAt)}
                              </p>
                            </div>
                            <Badge
                              variant={
                                comment.approved ? "default" : "secondary"
                              }
                            >
                              {comment.approved ? "Đã duyệt" : "Chờ duyệt"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="posts" className="space-y-6">
                  <PostsManagement />
                </TabsContent>

                <TabsContent value="comments" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quản lý bình luận</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nội dung</TableHead>
                            <TableHead>Tác giả</TableHead>
                            <TableHead>Bài viết</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="text-right">
                              Hành động
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comments?.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-8 text-muted-foreground"
                              >
                                Chưa có bình luận nào.
                              </TableCell>
                            </TableRow>
                          ) : (
                            comments?.map((comment) => (
                              <TableRow
                                key={comment.id}
                                className="hover:bg-muted/50 transition-colors group"
                              >
                                <TableCell>
                                  <div className="text-sm group-hover:text-primary transition-colors">
                                    {comment.content.length > 100
                                      ? comment.content.substring(0, 100) +
                                        "..."
                                      : comment.content}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-highlight/10 rounded-full flex items-center justify-center">
                                      <Users className="h-3 w-3 text-highlight" />
                                    </div>
                                    <span className="text-sm">
                                      {comment.author?.name || "Không có tên"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {comment.post?.title ||
                                      "Bài viết đã bị xóa"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      comment.approved ? "default" : "secondary"
                                    }
                                    className={
                                      comment.approved
                                        ? "bg-highlight text-primary-foreground"
                                        : ""
                                    }
                                  >
                                    {comment.approved
                                      ? "Đã duyệt"
                                      : "Chờ duyệt"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    {!comment.approved && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleApproveComment(comment.id)
                                        }
                                        title="Duyệt bình luận"
                                        className="hover:bg-highlight/10 hover:text-highlight"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRejectComment(comment.id)
                                      }
                                      title="Từ chối bình luận"
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
                </TabsContent>

                <TabsContent value="tags" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Quản lý thẻ</CardTitle>
                        <Dialog
                          open={isTagDialogOpen}
                          onOpenChange={setIsTagDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button onClick={resetTagForm}>
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
                                <Label htmlFor="tag-name">Tên thẻ</Label>
                                <Input
                                  id="tag-name"
                                  value={tagFormData.name}
                                  onChange={(e) =>
                                    setTagFormData({
                                      ...tagFormData,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Nhập tên thẻ..."
                                />
                              </div>
                              <div>
                                <Label htmlFor="tag-slug">Slug</Label>
                                <Input
                                  id="tag-slug"
                                  value={tagFormData.slug}
                                  onChange={(e) =>
                                    setTagFormData({
                                      ...tagFormData,
                                      slug: e.target.value,
                                    })
                                  }
                                  placeholder="Nhập slug..."
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsTagDialogOpen(false)}
                                >
                                  Hủy
                                </Button>
                                <Button onClick={handleCreateTag}>
                                  Tạo thẻ
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tên thẻ</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Số bài viết</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="text-right">
                              Hành động
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tags?.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-muted-foreground"
                              >
                                Chưa có thẻ nào.
                              </TableCell>
                            </TableRow>
                          ) : (
                            tags?.map((tag) => (
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
                                      onClick={() => openEditTagDialog(tag)}
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

                  {/* Edit Tag Dialog */}
                  <Dialog
                    open={isEditTagDialogOpen}
                    onOpenChange={setIsEditTagDialogOpen}
                  >
                    <DialogContent className="bg-background">
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa thẻ</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-tag-name">Tên thẻ</Label>
                          <Input
                            id="edit-tag-name"
                            value={tagFormData.name}
                            onChange={(e) =>
                              setTagFormData({
                                ...tagFormData,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nhập tên thẻ..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-tag-slug">Slug</Label>
                          <Input
                            id="edit-tag-slug"
                            value={tagFormData.slug}
                            onChange={(e) =>
                              setTagFormData({
                                ...tagFormData,
                                slug: e.target.value,
                              })
                            }
                            placeholder="Nhập slug..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditTagDialogOpen(false)}
                          >
                            Hủy
                          </Button>
                          <Button onClick={handleUpdateTag}>Cập nhật</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quản lý người dùng</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">Avatar</TableHead>
                            <TableHead>Tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Thống kê</TableHead>
                            <TableHead className="text-right">
                              Hành động
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users?.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-8 text-muted-foreground"
                              >
                                Chưa có người dùng nào.
                              </TableCell>
                            </TableRow>
                          ) : (
                            users?.map((user) => (
                              <TableRow
                                key={user.id}
                                className="hover:bg-muted/50 transition-colors group"
                              >
                                <TableCell>
                                  <div className="h-8 w-8 rounded-full bg-highlight/10 flex items-center justify-center">
                                    {user.image ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={
                                          user.image ||
                                          "/placeholder-avatar.png"
                                        }
                                        alt={user.name || "User"}
                                        className="h-8 w-8 rounded-full"
                                      />
                                    ) : (
                                      <Users className="h-4 w-4 text-highlight" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium group-hover:text-primary transition-colors">
                                    {user.name || "Không có tên"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {user.email}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-highlight/10 text-highlight"
                                  >
                                    {user.role?.name || "Chưa có vai trò"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    <div>
                                      {user._count?.posts || 0} bài viết
                                    </div>
                                    <div>
                                      {user._count?.comments || 0} bình luận
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Xem chi tiết"
                                      className="hover:bg-highlight/10 hover:text-highlight"
                                    >
                                      <Users className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openUserRoleDialog(user)}
                                      title="Chỉnh sửa vai trò"
                                      className="hover:bg-highlight/10 hover:text-highlight"
                                    >
                                      <Settings className="h-4 w-4" />
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

                  {/* User Role Dialog */}
                  <Dialog
                    open={isUserRoleDialogOpen}
                    onOpenChange={setIsUserRoleDialogOpen}
                  >
                    <DialogContent className="bg-background">
                      <DialogHeader>
                        <DialogTitle>
                          Chỉnh sửa vai trò cho{" "}
                          {selectedUser?.name || selectedUser?.email}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="user-role">Vai trò</Label>
                          <select
                            id="user-role"
                            value={userRoleFormData.roleId}
                            onChange={(e) =>
                              setUserRoleFormData({
                                ...userRoleFormData,
                                roleId: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          >
                            <option value="">Chọn vai trò</option>
                            {roles?.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsUserRoleDialogOpen(false)}
                          >
                            Hủy
                          </Button>
                          <Button onClick={handleAssignUserRole}>
                            Cập nhật vai trò
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Quản lý quyền</CardTitle>
                        <Button
                          onClick={() => setIsCreatePermissionOpen(true)}
                          className="bg-primary text-black"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tạo quyền mới
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tên quyền</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Tài nguyên</TableHead>
                            <TableHead>Hành động</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">
                              Thao tác
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {permissions?.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-muted-foreground"
                              >
                                Chưa có quyền nào.
                              </TableCell>
                            </TableRow>
                          ) : (
                            permissions?.map((permission) => (
                              <TableRow
                                key={permission.id}
                                className="hover:bg-muted/50 transition-colors group"
                              >
                                <TableCell>
                                  <div className="font-medium group-hover:text-primary transition-colors">
                                    {permission.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-highlight/10 text-highlight"
                                  >
                                    {permission.slug}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {permission.description || "Không có mô tả"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {permission.resource}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {permission.action}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      permission.isActive
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      permission.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-600"
                                    }
                                  >
                                    {permission.isActive
                                      ? "Hoạt động"
                                      : "Không hoạt động"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        openEditPermissionDialog(permission)
                                      }
                                      title="Chỉnh sửa"
                                      className="hover:bg-highlight/10 hover:text-highlight"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeletePermission(permission.id)
                                      }
                                      title="Xóa quyền"
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

                  {/* Create Permission Dialog */}
                  <Dialog
                    open={isCreatePermissionOpen}
                    onOpenChange={setIsCreatePermissionOpen}
                  >
                    <DialogContent className="bg-background">
                      <DialogHeader>
                        <DialogTitle>Tạo quyền mới</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="permission-name">Tên quyền</Label>
                          <Input
                            id="permission-name"
                            value={permissionFormData.name}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nhập tên quyền..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="permission-slug">Slug</Label>
                          <Input
                            id="permission-slug"
                            value={permissionFormData.slug}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                slug: e.target.value,
                              })
                            }
                            placeholder="Nhập slug..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="permission-description">Mô tả</Label>
                          <Input
                            id="permission-description"
                            value={permissionFormData.description || ""}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Nhập mô tả..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="permission-resource">
                            Tài nguyên
                          </Label>
                          <Input
                            id="permission-resource"
                            value={permissionFormData.resource}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                resource: e.target.value,
                              })
                            }
                            placeholder="Nhập tài nguyên..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="permission-action">Hành động</Label>
                          <Input
                            id="permission-action"
                            value={permissionFormData.action}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                action: e.target.value,
                              })
                            }
                            placeholder="Nhập hành động..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsCreatePermissionOpen(false)}
                          >
                            Hủy
                          </Button>
                          <Button
                            className="bg-primary text-black"
                            onClick={handleCreatePermission}
                          >
                            Tạo quyền
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Permission Dialog */}
                  <Dialog
                    open={isEditPermissionDialogOpen}
                    onOpenChange={setIsEditPermissionDialogOpen}
                  >
                    <DialogContent className="bg-background">
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa quyền</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-permission-name">
                            Tên quyền
                          </Label>
                          <Input
                            id="edit-permission-name"
                            value={permissionFormData.name}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nhập tên quyền..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-permission-slug">Slug</Label>
                          <Input
                            id="edit-permission-slug"
                            value={permissionFormData.slug}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                slug: e.target.value,
                              })
                            }
                            placeholder="Nhập slug..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-permission-description">
                            Mô tả
                          </Label>
                          <Input
                            id="edit-permission-description"
                            value={permissionFormData.description || ""}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Nhập mô tả..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-permission-resource">
                            Tài nguyên
                          </Label>
                          <Input
                            id="edit-permission-resource"
                            value={permissionFormData.resource}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                resource: e.target.value,
                              })
                            }
                            placeholder="Nhập tài nguyên..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-permission-action">
                            Hành động
                          </Label>
                          <Input
                            id="edit-permission-action"
                            value={permissionFormData.action}
                            onChange={(e) =>
                              setPermissionFormData({
                                ...permissionFormData,
                                action: e.target.value,
                              })
                            }
                            placeholder="Nhập hành động..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditPermissionDialogOpen(false)}
                          >
                            Hủy
                          </Button>
                          <Button
                            className="bg-primary text-black"
                            onClick={handleUpdatePermission}
                          >
                            Cập nhật
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="role-management" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Quản lý vai trò</CardTitle>
                        <Button
                          onClick={() => setIsCreateRoleOpen(true)}
                          className="bg-primary text-black"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tạo vai trò mới
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tên vai trò</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Quyền</TableHead>
                            <TableHead>Người dùng</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">
                              Thao tác
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roles?.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-muted-foreground"
                              >
                                Chưa có vai trò nào.
                              </TableCell>
                            </TableRow>
                          ) : (
                            roles?.map((role) => (
                              <TableRow
                                key={role.id}
                                className="hover:bg-muted/50 transition-colors group"
                              >
                                <TableCell>
                                  <div className="font-medium group-hover:text-primary transition-colors">
                                    {role.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-highlight/10 text-highlight"
                                  >
                                    {role.slug}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {role.description || "Không có mô tả"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-highlight/10 rounded-full flex items-center justify-center">
                                      <Key className="h-3 w-3 text-highlight" />
                                    </div>
                                    <span className="text-sm">
                                      {role.permissions?.length || 0} quyền
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-highlight/10 rounded-full flex items-center justify-center">
                                      <Users className="h-3 w-3 text-highlight" />
                                    </div>
                                    <span className="text-sm">
                                      {role._count?.users || 0} người dùng
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      role.isActive ? "default" : "secondary"
                                    }
                                    className={
                                      role.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-600"
                                    }
                                  >
                                    {role.isActive
                                      ? "Hoạt động"
                                      : "Không hoạt động"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditRoleDialog(role)}
                                      title="Chỉnh sửa"
                                      className="hover:bg-highlight/10 hover:text-highlight"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        openRolePermissionsDialog(role)
                                      }
                                      title="Quản lý quyền"
                                      className="hover:bg-highlight/10 hover:text-highlight"
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                    {!role.isSystem && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteRole(role.id)
                                        }
                                        title="Xóa vai trò"
                                        className="hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Create Role Dialog */}
                  <Dialog
                    open={isCreateRoleOpen}
                    onOpenChange={setIsCreateRoleOpen}
                  >
                    <DialogContent className="bg-background">
                      <DialogHeader>
                        <DialogTitle>Tạo vai trò mới</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="role-name">Tên vai trò</Label>
                          <Input
                            id="role-name"
                            value={roleFormData.name}
                            onChange={(e) =>
                              setRoleFormData({
                                ...roleFormData,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nhập tên vai trò..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="role-slug">Slug</Label>
                          <Input
                            id="role-slug"
                            value={roleFormData.slug}
                            onChange={(e) =>
                              setRoleFormData({
                                ...roleFormData,
                                slug: e.target.value,
                              })
                            }
                            placeholder="Nhập slug..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="role-description">Mô tả</Label>
                          <Input
                            id="role-description"
                            value={roleFormData.description || ""}
                            onChange={(e) =>
                              setRoleFormData({
                                ...roleFormData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Nhập mô tả..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsCreateRoleOpen(false)}
                          >
                            Hủy
                          </Button>
                          <Button
                            className="bg-primary text-black"
                            onClick={handleCreateRole}
                          >
                            Tạo vai trò
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Role Dialog */}
                  <Dialog
                    open={isEditRoleDialogOpen}
                    onOpenChange={setIsEditRoleDialogOpen}
                  >
                    <DialogContent className="bg-background">
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa vai trò</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-role-name">Tên vai trò</Label>
                          <Input
                            id="edit-role-name"
                            value={roleFormData.name}
                            onChange={(e) =>
                              setRoleFormData({
                                ...roleFormData,
                                name: e.target.value,
                              })
                            }
                            placeholder="Nhập tên vai trò..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-role-slug">Slug</Label>
                          <Input
                            id="edit-role-slug"
                            value={roleFormData.slug}
                            onChange={(e) =>
                              setRoleFormData({
                                ...roleFormData,
                                slug: e.target.value,
                              })
                            }
                            placeholder="Nhập slug..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-role-description">Mô tả</Label>
                          <Input
                            id="edit-role-description"
                            value={roleFormData.description || ""}
                            onChange={(e) =>
                              setRoleFormData({
                                ...roleFormData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Nhập mô tả..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditRoleDialogOpen(false)}
                          >
                            Hủy
                          </Button>
                          <Button
                            className="bg-primary text-black"
                            onClick={handleUpdateRole}
                          >
                            Cập nhật
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Role Permissions Dialog */}
                  <Dialog
                    open={isRolePermissionsDialogOpen}
                    onOpenChange={setIsRolePermissionsDialogOpen}
                  >
                    <DialogContent className="bg-background max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          Quản lý quyền cho vai trò: {selectedRole?.name}
                        </DialogTitle>
                        <DialogDescription>
                          Chọn các quyền mà vai trò này có thể thực hiện. Hiện
                          tại có {rolePermissions.length} quyền được chọn.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="max-h-96 overflow-y-auto">
                          {!permissions || permissions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <div className="flex flex-col items-center space-y-2">
                                <Key className="h-8 w-8 text-muted-foreground" />
                                <p>Chưa có quyền nào được tạo.</p>
                                <p className="text-xs">
                                  Vui lòng tạo quyền trước khi phân quyền cho
                                  vai trò.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              {permissions.map((permission) => (
                                <div
                                  key={permission.id}
                                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    id={`permission-${permission.id}`}
                                    checked={rolePermissions.includes(
                                      permission.id
                                    )}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setRolePermissions([
                                          ...rolePermissions,
                                          permission.id,
                                        ]);
                                      } else {
                                        setRolePermissions(
                                          rolePermissions.filter(
                                            (id) => id !== permission.id
                                          )
                                        );
                                      }
                                    }}
                                    className="rounded h-4 w-4 text-primary focus:ring-primary"
                                  />
                                  <div className="flex-1">
                                    <label
                                      htmlFor={`permission-${permission.id}`}
                                      className="text-sm font-medium cursor-pointer block"
                                    >
                                      {permission.name}
                                    </label>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {permission.resource}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {permission.action}
                                      </Badge>
                                    </div>
                                    {permission.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {permission.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {permissions && permissions.length > 0 && (
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRolePermissions(
                                    permissions.map((p) => p.id)
                                  );
                                }}
                              >
                                Chọn tất cả
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRolePermissions([]);
                                }}
                              >
                                Bỏ chọn tất cả
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {rolePermissions.length} / {permissions.length}{" "}
                              quyền được chọn
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setIsRolePermissionsDialogOpen(false)
                            }
                          >
                            Hủy
                          </Button>
                          <Button
                            className="bg-primary text-black"
                            onClick={handleUpdateRolePermissions}
                          >
                            Cập nhật quyền
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TabsContent>
              </>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
