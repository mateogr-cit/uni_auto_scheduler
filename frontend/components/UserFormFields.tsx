import { User as UserIcon, Mail, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";

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
        <FieldGroup>
            <Field>
                <FieldLabel htmlFor="fname">First Name</FieldLabel>
                <InputGroup>
                    <InputGroupAddon align="inline-start">
                        <UserIcon data-icon="inline-start" />
                    </InputGroupAddon>
                    <InputGroupInput
                        id="fname"
                        placeholder="John"
                        value={formData.fname}
                        onChange={(e) => onChange('fname', e.target.value)}
                        className="capitalize"
                        required
                    />
                </InputGroup>
            </Field>
            <Field>
                <FieldLabel htmlFor="lname">Last Name</FieldLabel>
                <InputGroup>
                    <InputGroupAddon align="inline-start">
                        <UserIcon data-icon="inline-start" />
                    </InputGroupAddon>
                    <InputGroupInput
                        id="lname"
                        placeholder="Doe"
                        value={formData.lname}
                        onChange={(e) => onChange('lname', e.target.value)}
                        className="capitalize"
                        required
                    />
                </InputGroup>
            </Field>
            <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <InputGroup>
                    <InputGroupAddon align="inline-start">
                        <Mail data-icon="inline-start" />
                    </InputGroupAddon>
                    <InputGroupInput
                        id="email"
                        type="email"
                        placeholder="john.doe@university.edu"
                        value={formData.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        required
                    />
                </InputGroup>
            </Field>
            <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <InputGroup>
                    <InputGroupAddon align="inline-start">
                        <span className="font-bold">@</span>
                    </InputGroupAddon>
                    <InputGroupInput
                        id="username"
                        placeholder="jdoe"
                        value={formData.username}
                        onChange={(e) => onChange('username', e.target.value)}
                        required
                    />
                </InputGroup>
            </Field>
            <Field>
                <FieldLabel htmlFor="password">
                    {editing ? "New Password (Optional)" : "Password"}
                </FieldLabel>
                <InputGroup>
                    <InputGroupInput
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => onChange('password', e.target.value)}
                        required={!editing}
                    />
                    <InputGroupAddon align="inline-end">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </InputGroupAddon>
                </InputGroup>
            </Field>
        </FieldGroup>
    );
}