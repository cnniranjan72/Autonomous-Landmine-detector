import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await api.post(endpoint, { email, password });

      if (isLogin) {
        localStorage.setItem("token", res.data.access_token);
        toast.success("Login successful!", {
          description: "Redirecting to dashboard...",
        });
      } else {
        toast.success("Registration successful!", {
          description: "You can now log in.",
        });
        setIsLogin(true);
        setIsLoading(false);
        return;
      }

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Authentication failed. Try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <Card className="w-full max-w-md border-2 border-primary/30 bg-card/90 backdrop-blur-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? "SYSTEM LOGIN" : "REGISTER ACCOUNT"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Access the autonomous detection system"
                : "Create your operator account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "PROCESSING..." : isLogin ? "LOGIN" : "REGISTER"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Need an account? Register here" : "Already have an account? Login here"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Button
              variant="outline"
              className="w-full border-primary/30"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              BACK TO HOME
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
