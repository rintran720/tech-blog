import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, LogIn, Home, Shield } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Truy cập bị từ chối
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p className="mb-2">Bạn không có quyền truy cập trang quản trị.</p>
            <p className="text-sm">
              Chỉ có vai trò <strong>Super Admin</strong> mới có thể truy cập
              trang này.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Nếu bạn nghĩ đây là lỗi, vui lòng liên hệ với quản trị viên hệ
              thống.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
