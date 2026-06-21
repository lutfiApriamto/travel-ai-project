import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../api/useLogin.js';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password wajib diisi'),
});

export const useLoginForm = () => {
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver:      zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((data) => login(data));

  return { register, errors, onSubmit, isPending };
};
