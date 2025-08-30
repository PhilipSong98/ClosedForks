import { SetPasswordForm } from '@/components/auth/SetPasswordForm';

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <SetPasswordForm />
      </div>
    </div>
  );
}