import { z } from 'zod'

export const UserSchema = z.object({
  first_name: z.string().min(2, 'Слишком короткое имя'),
  last_name: z.string().min(2, 'Слишком короткая фамилия'),
  email: z.string().email('Некорректный адрес электронной почты'),
  contact_number: z.string().min(4, 'Некорректный номер телефона').optional(),
  date_of_birth: z
    .date({
      required_error: 'Введите дату',
      invalid_type_error: 'Не верный тип',
    })
    .optional(),
  password: z
    .string()
    .min(8, 'Слишком короткий пароль')
    .regex(/.*[A-Z].*/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/^(?=.*\d).*$/, 'Пароль должен содержать как минимум одну цифру'),
})
