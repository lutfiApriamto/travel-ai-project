import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '../api/useRegister.js';

const schema = z
  .object({
    name: z
      .string()
      .min(2,   'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter'),

    email: z
      .string()
      .min(1, 'Email wajib diisi')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid'),

    // Phone opsional — validasi hanya jika diisi (empty string = lewati)
    phone: z
      .string()
      .refine(
        (val) => val === '' || /^[0-9+\-\s]{8,20}$/.test(val),
        { message: 'Format nomor tidak valid (8–20 digit)' }
      ),

    password: z
      .string()
      .refine(
        (v) =>
          v.length >= 8 &&
          /[A-Z]/.test(v) &&
          /[a-z]/.test(v) &&
          /[0-9]/.test(v) &&
          /[^A-Za-z0-9\s]/.test(v),
        { message: 'Password tidak memenuhi semua persyaratan di atas' }
      ),

    confirmPassword: z
      .string()
      .min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path:    ['confirmPassword'],
  });

export const useRegisterForm = () => {
  const { mutate: register, isPending } = useRegister();

  const {
    register: field,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver:      zodResolver(schema),
    defaultValues: {
      name:            '',
      email:           '',
      phone:           '',
      password:        '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit((data) => register(data));

  return { field, errors, onSubmit, isPending, watch };
};
