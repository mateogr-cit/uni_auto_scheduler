import { User as UserIcon, Mail, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface UserFormFieldsProps {
    formData: {
        fname: string;
        lname: string;
        email: string;
        username: string;
        password: string;
    };
    onChange: (field: string, value: string) => void;
    editing: boolean;
}

export default function UserFormFields({ formData, onChange, editing }: UserFormFieldsProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1">First Name</label>
                <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="John"
                        value={formData.fname}
                        onChange={(e) => onChange('fname', e.target.value)}
                        className="capitalize w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all"
                        required
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1">Last Name</label>
                <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Doe"
                        value={formData.lname}
                        onChange={(e) => onChange('lname', e.target.value)}
                        className="capitalize w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all"
                        required
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1">Email Address</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                        type="email"
                        placeholder="john.doe@university.edu"
                        value={formData.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all"
                        required
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1">Username</label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold group-focus-within:text-red-500 transition-colors">@</span>
                    <input
                        type="text"
                        placeholder="jdoe"
                        value={formData.username}
                        onChange={(e) => onChange('username', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all"
                        required
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1">
                    {editing ? "New Password (Optional)" : "Password"}
                </label>
                <div className="relative group">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => onChange('password', e.target.value)}
                        className="w-full px-5 pr-12 py-3.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all"
                        required={!editing}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}