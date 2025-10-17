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
import { Plus, Settings, XCircle, Key, Users, Shield } from "lucide-react";

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
}

interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  resource: string;
  action: string;
  isActive: boolean;
}

interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  granted: boolean;
  createdAt: string;
  permission: Permission;
}

export default function AdminRolesPage() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/admin/permissions");
      const data = await response.json();
      setPermissions(data.permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

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
        setIsCreateOpen(false);
        resetRoleForm();
        fetchRoles();
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
        setIsEditOpen(false);
        resetRoleForm();
        fetchRoles();
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
        fetchRoles();
      } else {
        const data = await response.json();
        console.error("Error deleting role:", data.error);
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    }
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
          body: JSON.stringify({
            permissions: rolePermissions.map((rp) => rp.permissionId),
          }),
        }
      );

      if (response.ok) {
        setIsPermissionsOpen(false);
        setSelectedRole(null);
        setRolePermissions([]);
        fetchRoles();
      } else {
        const data = await response.json();
        console.error("Error updating role permissions:", data.error);
      }
    } catch (error) {
      console.error("Error updating role permissions:", error);
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

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || "",
    });
    setIsEditOpen(true);
  };

  const openPermissionsDialog = async (role: Role) => {
    setSelectedRole(role);

    // Fetch current role permissions
    try {
      const response = await fetch(`/api/admin/roles/${role.id}/permissions`);
      const data = await response.json();
      // API returns array directly, not wrapped in { permissions: [...] }
      setRolePermissions(data || []);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      setRolePermissions([]);
    }

    setIsPermissionsOpen(true);
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
          <h1 className="text-3xl font-bold">Quản lý vai trò</h1>
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
        <h1 className="text-3xl font-bold">Quản lý vai trò</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetRoleForm} className="bg-primary text-black">
              <Plus className="mr-2 h-4 w-4" />
              Tạo vai trò mới
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Tạo vai trò mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên vai trò</Label>
                <Input
                  id="name"
                  value={roleFormData.name}
                  onChange={(e) =>
                    setRoleFormData({ ...roleFormData, name: e.target.value })
                  }
                  placeholder="Nhập tên vai trò..."
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={roleFormData.slug}
                  onChange={(e) =>
                    setRoleFormData({ ...roleFormData, slug: e.target.value })
                  }
                  placeholder="slug-vai-tro"
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  value={roleFormData.description}
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
                  onClick={() => setIsCreateOpen(false)}
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
      </div>

      {/* Roles Table */}
      <Card>
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
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có vai trò nào.
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
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
                        variant={role.isActive ? "default" : "secondary"}
                        className={
                          role.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {role.isActive ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                          title="Chỉnh sửa"
                          className="hover:bg-highlight/10 hover:text-highlight"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPermissionsDialog(role)}
                          title="Quản lý quyền"
                          className="hover:bg-highlight/10 hover:text-highlight"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa vai trò</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên vai trò</Label>
              <Input
                id="edit-name"
                value={roleFormData.name}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, name: e.target.value })
                }
                placeholder="Nhập tên vai trò..."
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={roleFormData.slug}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, slug: e.target.value })
                }
                placeholder="slug-vai-tro"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Input
                id="edit-description"
                value={roleFormData.description}
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
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
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

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="bg-background max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Quản lý quyền cho vai trò: {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              Chọn các quyền mà vai trò này có thể thực hiện. Hiện tại có{" "}
              {rolePermissions.length} quyền được chọn.
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
                      Vui lòng tạo quyền trước khi phân quyền cho vai trò.
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
                        checked={rolePermissions.some(
                          (rp) => rp.permissionId === permission.id
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRolePermissions([
                              ...rolePermissions,
                              {
                                id: "",
                                roleId: selectedRole?.id || "",
                                permissionId: permission.id,
                                granted: true,
                                createdAt: "",
                                permission: permission,
                              },
                            ]);
                          } else {
                            setRolePermissions(
                              rolePermissions.filter(
                                (rp) => rp.permissionId !== permission.id
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
                          <Badge variant="outline" className="text-xs">
                            {permission.resource}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
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
                        permissions.map((p) => ({
                          id: "",
                          roleId: selectedRole?.id || "",
                          permissionId: p.id,
                          granted: true,
                          createdAt: "",
                          permission: p,
                        }))
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
                  {rolePermissions.length} / {permissions.length} quyền được
                  chọn
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsPermissionsOpen(false)}
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
    </div>
  );
}
