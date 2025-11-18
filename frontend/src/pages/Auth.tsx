import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Shield, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email, password } : { username, email, password };

      const res = await api.post(endpoint, payload);

      if (isLogin) {
        localStorage.setItem("token", res.data.token);
        toast.success("Login successful!", {
          description: "Redirecting to dashboard...",
        });
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        toast.success("Registration successful!", {
          description: "You can now log in.",
        });
        setIsLogin(true);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Authentication failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      <Navbar />
      <div className="h-24"></div>


      {/* TOP HEADING — MATCHES DASHBOARD */}
    <div className="text-center mt-6 mb-4 animate-fadeIn">
  <h1 className="text-3xl md:text-4xl font-extrabold tracking-[0.25em] 
                 text-[#1a8cff] 
                 drop-shadow-[0_0_10px_rgba(0,140,255,0.8)]
                 uppercase">
    {isLogin ? "SYSTEM LOGIN" : "REGISTER ACCOUNT"}
  </h1>

  <p className="mt-2 text-gray-300 tracking-wide uppercase 
                drop-shadow-[0_0_6px_rgba(0,150,255,0.5)] text-sm">
    {isLogin ? "Secure Access to Detection System" : "Create Your Operator Access"}
  </p>
</div>


      {/* AUTH BOX */}
      
        <div className="flex items-center justify-center px-4 pb-10 animate-slideUp">

        <Card className="
          w-full max-w-md p-8 rounded-2xl
          bg-gray-900/60 backdrop-blur-xl
          border border-primary/40
          shadow-[0_0_25px_rgba(0,120,255,0.35)]
          animate-glowPulse
        ">
          
          {/* ICON */}
          <div className="text-center mb-8">
            <div className="inline-flex p-5 bg-primary/10 rounded-full shadow-[0_0_15px_rgba(30,144,255,0.5)]">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* USERNAME (ONLY IN REGISTER MODE) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="uppercase text-xs tracking-wide">
                  Username
                </Label>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/80" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="
                      pl-10 bg-black/40 border border-blue-500/30 
                      focus:ring-2 focus:ring-primary/60
                    "
                    required
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email" className="uppercase text-xs tracking-wide">
                Email
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/80" />
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    pl-10 bg-black/40 border border-blue-500/30 
                    focus:ring-2 focus:ring-primary/60
                  "
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password" className="uppercase text-xs tracking-wide">
                Password
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/80" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    pl-10 bg-black/40 border border-blue-500/30 
                    focus:ring-2 focus:ring-primary/60
                  "
                  required
                />
              </div>
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              className="
                w-full py-3 text-base font-semibold tracking-wide
                bg-primary hover:bg-primary/80 transition-all duration-200
                shadow-[0_0_15px_rgba(0,120,255,0.3)]
              "
              disabled={isLoading}
            >
              {isLoading
                ? "PROCESSING..."
                : isLogin ? "LOGIN" : "REGISTER"}
            </Button>
          </form>

          {/* TOGGLE LOGIN/REGISTER */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-300 hover:text-primary transition-colors"
            >
              {isLogin
                ? "Need an account? Register here"
                : "Already have an account? Login here"}
            </button>
          </div>

          {/* BACK BUTTON */}
          <div className="mt-8 pt-6 border-t border-blue-900/40">
            <Button
              variant="outline"
              className="
                w-full border-primary/40 hover:bg-primary/10
              "
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
