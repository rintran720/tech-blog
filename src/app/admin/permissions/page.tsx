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
import { Plus, Settings, XCircle, Key, Search } from "lucide-react";

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

export default function AdminPermissionsPage() {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    resource: "",
    action: "",
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredPermissions(permissions);
    } else {
      const filtered = permissions.filter(
        (permission) =>
          permission.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          permission.resource
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          permission.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPermissions(filtered);
    }
  }, [permissions, searchTerm]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/admin/permissions");
      const data = await response.json();
      setPermissions(data.permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    try {
      const response = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsCreateOpen(false);
        resetForm();
        fetchPermissions();
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
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setIsEditOpen(false);
        resetForm();
        fetchPermissions();
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
        fetchPermissions();
      } else {
        const data = await response.json();
        console.error("Error deleting permission:", data.error);
      }
    } catch (error) {
      console.error("Error deleting permission:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      resource: "",
      action: "",
    });
    setSelectedPermission(null);
  };

  const openEditDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      slug: permission.slug,
      description: permission.description || "",
      resource: permission.resource,
      action: permission.action,
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
          <h1 className="text-3xl font-bold">Quản lý quyền</h1>
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
        <h1 className="text-3xl font-bold">Quản lý quyền</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary text-black">
              <Plus className="mr-2 h-4 w-4" />
              Tạo quyền mới
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Tạo quyền mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên quyền</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nhập tên quyền..."
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
                  placeholder="resource.action"
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Nhập mô tả..."
                />
              </div>
              <div>
                <Label htmlFor="resource">Tài nguyên</Label>
                <Input
                  id="resource"
                  value={formData.resource}
                  onChange={(e) =>
                    setFormData({ ...formData, resource: e.target.value })
                  }
                  placeholder="Nhập tài nguyên..."
                />
              </div>
              <div>
                <Label htmlFor="action">Hành động</Label>
                <Input
                  id="action"
                  value={formData.action}
                  onChange={(e) =>
                    setFormData({ ...formData, action: e.target.value })
                  }
                  placeholder="Nhập hành động..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
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
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm quyền theo slug, tên, resource, action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                {filteredPermissions.length} / {permissions.length} quyền
              </div>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Search Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground py-2">
              Tìm nhanh:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("admin")}
              className="text-xs"
            >
              Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("posts")}
              className="text-xs"
            >
              Posts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("users")}
              className="text-xs"
            >
              Users
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("roles")}
              className="text-xs"
            >
              Roles
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("comments")}
              className="text-xs"
            >
              Comments
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("tags")}
              className="text-xs"
            >
              Tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("analytics")}
              className="text-xs"
            >
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
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
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm
                      ? "Không tìm thấy quyền nào phù hợp."
                      : "Chưa có quyền nào."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions?.map((permission) => (
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
                      <Badge variant="outline" className="text-xs">
                        {permission.resource}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {permission.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={permission.isActive ? "default" : "secondary"}
                        className={
                          permission.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {permission.isActive ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(permission)}
                          title="Chỉnh sửa"
                          className="hover:bg-highlight/10 hover:text-highlight"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePermission(permission.id)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa quyền</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên quyền</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên quyền..."
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
                placeholder="resource.action"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Nhập mô tả..."
              />
            </div>
            <div>
              <Label htmlFor="edit-resource">Tài nguyên</Label>
              <Input
                id="edit-resource"
                value={formData.resource}
                onChange={(e) =>
                  setFormData({ ...formData, resource: e.target.value })
                }
                placeholder="Nhập tài nguyên..."
              />
            </div>
            <div>
              <Label htmlFor="edit-action">Hành động</Label>
              <Input
                id="edit-action"
                value={formData.action}
                onChange={(e) =>
                  setFormData({ ...formData, action: e.target.value })
                }
                placeholder="Nhập hành động..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
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
    </div>
  );
}
