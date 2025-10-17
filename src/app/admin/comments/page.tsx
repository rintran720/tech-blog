"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  FileText,
  Calendar,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  approved: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function AdminCommentsPage() {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await fetch("/api/admin/comments");
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        fetchComments();
      } else {
        const data = await response.json();
        console.error("Error approving comment:", data.error);
      }
    } catch (error) {
      console.error("Error approving comment:", error);
    }
  };

  const handleRejectComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved: false }),
      });

      if (response.ok) {
        fetchComments();
      } else {
        const data = await response.json();
        console.error("Error rejecting comment:", data.error);
      }
    } catch (error) {
      console.error("Error rejecting comment:", error);
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Quản lý bình luận</h1>
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
        <h1 className="text-3xl font-bold">Quản lý bình luận</h1>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Tổng: {comments.length} bình luận</Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Chờ duyệt: {comments.filter((c) => !c.approved).length}
          </Badge>
        </div>
      </div>

      {/* Comments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nội dung</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Bài viết</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có bình luận nào.
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment) => (
                  <TableRow
                    key={comment.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm line-clamp-3">
                          {comment.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {comment.author.name || "Không có tên"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {comment.author.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium line-clamp-1">
                            {comment.post.title}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={comment.approved ? "default" : "secondary"}
                        className={
                          comment.approved
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {comment.approved ? "Đã duyệt" : "Chờ duyệt"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {!comment.approved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproveComment(comment.id)}
                            title="Duyệt bình luận"
                            className="hover:bg-green-100 hover:text-green-800"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {comment.approved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectComment(comment.id)}
                            title="Từ chối bình luận"
                            className="hover:bg-red-100 hover:text-red-800"
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
    </div>
  );
}
