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
} from "@/components/ui/dialog";
import { Settings, Users, FileText, MessageSquare } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  role: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count: {
    posts: number;
    comments: number;
  };
}

interface Role {
  id: string;
  name: string;
  slug: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    roleId: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleFormData),
      });

      if (response.ok) {
        setIsRoleDialogOpen(false);
        resetRoleForm();
        fetchUsers();
      } else {
        const data = await response.json();
        console.error("Error assigning role:", data.error);
      }
    } catch (error) {
      console.error("Error assigning role:", error);
    }
  };

  const resetRoleForm = () => {
    setRoleFormData({
      roleId: "",
    });
    setSelectedUser(null);
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setRoleFormData({
      roleId: user.role?.id || "",
    });
    setIsRoleDialogOpen(true);
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
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
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
        <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Avatar</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Thống kê</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có người dùng nào.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <TableCell>
                      <div className="h-8 w-8 rounded-full bg-highlight/10 flex items-center justify-center">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image || "/placeholder-avatar.png"}
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
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{user._count?.posts || 0} bài viết</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{user._count?.comments || 0} bình luận</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRoleDialog(user)}
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

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Gán vai trò cho người dùng</DialogTitle>
            <DialogDescription>
              Chọn vai trò cho {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-role">Vai trò</Label>
              <select
                id="user-role"
                value={roleFormData.roleId}
                onChange={(e) => setRoleFormData({ roleId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Chọn vai trò</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                className="bg-primary text-black"
                onClick={handleAssignRole}
              >
                Cập nhật vai trò
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
