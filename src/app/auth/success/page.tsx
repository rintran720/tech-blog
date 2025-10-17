"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

function SignInSuccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Auto redirect sau 3 giây
    const timer = setTimeout(() => {
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.push(callbackUrl);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  const handleContinue = () => {
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    router.push(callbackUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Đăng nhập thành công!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p className="mb-2">Chào mừng bạn đến với Blog Công Nghệ!</p>
            <p className="text-sm">
              Bạn sẽ được chuyển hướng tự động sau 3 giây...
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleContinue} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Tiếp tục
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Về trang chủ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInSuccessForm />
    </Suspense>
  );
}
