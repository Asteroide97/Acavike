import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Escribe tu nombre."),
    companyName: z.string().min(2, "Escribe el nombre de la empresa."),
    email: z.string().email("Ingresa un correo válido."),
    phone: z.string().min(8, "Ingresa un teléfono válido."),
    rfc: z.string().optional(),
    address: z.string().min(10, "Ingresa una dirección completa."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().min(2, "Escribe tu nombre."),
  companyName: z.string().optional(),
  email: z.string().email("Ingresa un correo válido."),
  phone: z.string().optional(),
  message: z.string().min(10, "Describe tu solicitud."),
});

export const quickQuoteSchema = z.object({
  name: z.string().min(2, "Escribe tu nombre."),
  companyName: z.string().min(2, "Escribe tu empresa."),
  email: z.string().email("Ingresa un correo válido."),
  phone: z.string().min(8, "Ingresa un teléfono válido."),
  requirements: z.string().min(10, "Describe o lista los productos que necesitas."),
  notes: z.string().optional(),
});

export const checkoutSchema = z.object({
  name: z.string().min(2, "Escribe el nombre de contacto."),
  companyName: z.string().min(2, "Escribe la empresa."),
  email: z.string().email("Ingresa un correo válido."),
  phone: z.string().min(8, "Ingresa un teléfono válido."),
  address: z.string().min(10, "Ingresa la dirección de entrega."),
  rfc: z.string().optional(),
  deliveryMethod: z.string().min(2, "Selecciona un método de entrega."),
  notes: z.string().optional(),
  createAccount: z.boolean().default(false),
  password: z.string().optional(),
})
  .superRefine((value, ctx) => {
    if (value.createAccount && (!value.password || value.password.length < 8)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Define una contraseña de al menos 8 caracteres.",
      });
    }
  });
