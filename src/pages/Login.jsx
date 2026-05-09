import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("admin@mra.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login successful");
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">

      {/* background glow */}
      <div className="absolute w-[500px] h-[500px] bg-green-500 opacity-20 blur-3xl rounded-full top-[-100px] left-[-100px]"></div>
      <div className="absolute w-[400px] h-[400px] bg-white opacity-10 blur-3xl rounded-full bottom-[-100px] right-[-100px]"></div>

      {/* LOGIN CARD */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 w-[380px] bg-black/60 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl"
      >

        {/* header */}
        <h1 className="text-3xl font-bold text-white text-center">
          MRA INVENTORY
        </h1>

        <p className="text-center text-gray-400 text-sm mt-2 mb-6">
          Sign in to continue
        </p>

        {/* email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full bg-gray-900 text-white p-3 rounded-xl border border-gray-700 outline-none focus:border-green-500 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full bg-gray-900 text-white p-3 rounded-xl border border-gray-700 outline-none focus:border-green-500 mb-5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* button */}
        <button
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-black"
          }`}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        {/* footer text */}
        <p className="text-xs text-gray-500 text-center mt-5">
          Secure access only for MRA system
        </p>
      </form>
    </div>
  );
};

export default Login;