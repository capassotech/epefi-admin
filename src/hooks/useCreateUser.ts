import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { type CreateUserFormData, type CreateUserResponse } from "@/types/types";
import { StudentsAPI } from "@/service/students";  


export const useCreateUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  // const { createUserDB } = useStudents();

  const createUser = async (
    userData: CreateUserFormData
  ): Promise<CreateUserResponse> => {
    setIsLoading(true);

    try {
      if (userData.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      const registerData: CreateUserFormData = {
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        password: userData.password,
        dni: userData.dni,
        role: {
          admin: userData.role.admin,
          student: userData.role.student,
        },
        emailVerificado: true,
        cursos_asignados: userData.cursos_asignados,
        activo: true,
      };

      console.log(registerData);

      const response = await StudentsAPI.createStudent(registerData);
      console.log(response);

      toast({
        title: "Usuario creado exitosamente",
        description: `El usuario ${userData.nombre} ${userData.apellido} ha sido registrado correctamente.`,
      });

      return {
        success: true,
        message: "Usuario creado exitosamente",
        // user: response,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      toast({
        title: "Error al crear usuario",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createUser,
    isLoading,
  };
};
