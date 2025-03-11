import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Signup = () => {
    const [formData, setFormData] = useState({ email: "", password: "", role: "customer" });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/signup", formData, {
                headers: { "Content-Type": "application/json" },
            });

            // Save token to local storage
            localStorage.setItem("token", res.data.token);
            toast.success("Signup successful!");

            // Redirect to login or homepage
            navigate("/login");
        } catch (err) {
            console.error("Signup error:", err);
            toast.error(err.response ?.data ?.error || "Signup failed!");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md">
            <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1">Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-1">Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <button type="submit" className="w-full bg-black text-white py-2 rounded">
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default Signup;
