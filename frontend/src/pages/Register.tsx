import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  BookOpen,
  ArrowRight 
} from 'lucide-react';

// Password validation regex patterns
const passwordPatterns = {
  minLength: /.{8,}/,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

const registerSchema = yup.object({
  firstName: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre debe tener menos de 50 caracteres'),
  lastName: yup
    .string()
    .required('El apellido es obligatorio')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido debe tener menos de 50 caracteres'),
  email: yup
    .string()
    .email('Por favor ingresa un correo electrónico válido')
    .required('El correo es obligatorio'),
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .test('password-strength', 'La contraseña debe cumplir los requisitos', function(value) {
      if (!value) return false;
      const checks = [
        passwordPatterns.minLength.test(value),
        passwordPatterns.hasUppercase.test(value),
        passwordPatterns.hasLowercase.test(value),
        passwordPatterns.hasNumber.test(value),
        passwordPatterns.hasSpecialChar.test(value),
      ];
      return checks.filter(Boolean).length >= 4; // Al menos 4 de 5 requisitos
    }),
  confirmPassword: yup
    .string()
    .required('Por favor confirma tu contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas deben coincidir'),
});

type RegisterFormData = yup.InferType<typeof registerSchema>;

interface PasswordRequirement {
  id: string;
  text: string;
  pattern: RegExp;
}

const passwordRequirements: PasswordRequirement[] = [
  { id: 'length', text: 'Al menos 8 caracteres', pattern: passwordPatterns.minLength },
  { id: 'uppercase', text: 'Una letra mayúscula', pattern: passwordPatterns.hasUppercase },
  { id: 'lowercase', text: 'Una letra minúscula', pattern: passwordPatterns.hasLowercase },
  { id: 'number', text: 'Un número', pattern: passwordPatterns.hasNumber },
  { id: 'special', text: 'Un carácter especial', pattern: passwordPatterns.hasSpecialChar },
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Si ya está autenticado, redirigir a /books
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/books', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const password = watch('password', '');

  const checkPasswordRequirement = (requirement: PasswordRequirement) => {
    return requirement.pattern.test(password);
  };

  const getPasswordStrength = () => {
    const metRequirements = passwordRequirements.filter(req => 
      checkPasswordRequirement(req)
    ).length;
    
    if (metRequirements >= 5) return { label: 'Fuerte', color: 'text-green-600' };
    if (metRequirements >= 3) return { label: 'Media', color: 'text-yellow-600' };
    if (metRequirements >= 1) return { label: 'Débil', color: 'text-red-600' };
    return { label: 'Sin requisitos', color: 'text-gray-500' };
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        confirmPassword: data.confirmPassword,
      });
      // La navegación se maneja en el hook useAuth para mantener consistencia
    } catch (error) {
      // El error ya está manejado por el hook useAuth
      console.error('Error en registro:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-gray-900" />
            <span className="text-2xl font-semibold text-gray-900">CMPC</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-medium text-gray-900">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Únete a nuestra comunidad de amantes de los libros
        </p>
      </div>

      <div className="mt-8 w-full">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    placeholder="Juan"
                    {...registerField('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Apellido
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    placeholder="Pérez"
                    {...registerField('lastName')}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  placeholder="tu@ejemplo.com"
                  {...registerField('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  placeholder="••••••••"
                  {...registerField('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Fortaleza de la contraseña:</span>
                    <span className={getPasswordStrength().color}>
                      {getPasswordStrength().label}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Password requirements */}
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-600 mb-1">Requisitos de contraseña (se requieren 4 de 5):</p>
                {passwordRequirements.map((requirement) => {
                  const isMet = checkPasswordRequirement(requirement);
                  return (
                    <div key={requirement.id} className="flex items-center text-xs">
                      {isMet ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-300 mr-1" />
                      )}
                      <span className={isMet ? 'text-green-600' : 'text-gray-500'}>
                        {requirement.text}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  placeholder="••••••••"
                  {...registerField('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duración-200"
              >
                {isLoading ? (
                  <span>Creando cuenta...</span>
                ) : (
                  <span className="flex items-center">
                    Crear cuenta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duración-200"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs text-center text-gray-500">
              Al crear una cuenta, aceptas nuestros Términos de Servicio y Política de Privacidad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}