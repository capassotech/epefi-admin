import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { type CreateUserFormData, type CreateUserResponse } from "@/types/types";
import { StudentsAPI } from "@/service/students";
import { isDuplicateEmailRegistrationError } from "@/utils/errorMessages";
import { isPasswordPolicySatisfied } from "@/utils/passwordValidation";


export const useCreateUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createUser = async (
    userData: CreateUserFormData
  ): Promise<CreateUserResponse> => {
    setIsLoading(true);

    try {
      if (!isPasswordPolicySatisfied(userData.password)) {
        throw new Error(
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial"
        );
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

      const response = (await StudentsAPI.createStudent(registerData)) as Record<
        string,
        unknown
      >;
      console.log(response);

      const newId = String(
        (response?.id as string | undefined) ??
          (response?.uid as string | undefined) ??
          ""
      );

      toast({
        title: "Usuario creado exitosamente",
        description: `El usuario ${userData.nombre} ${userData.apellido} ha sido registrado correctamente.`,
      });

      return {
        success: true,
        message: "Usuario creado exitosamente",
        user: {
          id: newId,
          nombre: (response?.nombre as string) ?? userData.nombre,
          apellido: (response?.apellido as string) ?? userData.apellido,
          email: (response?.email as string) ?? userData.email,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      const httpStatus =
        error instanceof Error
          ? (error as Error & { httpStatus?: number }).httpStatus
          : undefined;
      const emailAlreadyInUse = isDuplicateEmailRegistrationError(
        errorMessage,
        httpStatus
      );

      toast({
        title: "Error al crear usuario",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        message: errorMessage,
        ...(emailAlreadyInUse ? { emailAlreadyInUse: true as const } : {}),
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (
    id: string,
    userData: Partial<CreateUserFormData>
  ): Promise<CreateUserResponse> => {
    setIsLoading(true);

    try {
      const response = (await StudentsAPI.updateStudent(id, userData)) as Record<
        string,
        unknown
      >;
      console.log(response);

      const rid = String(
        (response?.id as string | undefined) ??
          (response?.uid as string | undefined) ??
          id
      );

      toast({
        title: "Usuario actualizado exitosamente",
        description: `El usuario ${userData.nombre} ${userData.apellido} ha sido actualizado correctamente.`,
      });

      return {
        success: true,
        message: "Usuario actualizado exitosamente",
        user: {
          id: rid,
          nombre: (response?.nombre as string) ?? userData.nombre ?? "",
          apellido: (response?.apellido as string) ?? userData.apellido ?? "",
          email: (response?.email as string) ?? userData.email ?? "",
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      toast({
        title: "Error al actualizar usuario",
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
    updateUser,
    isLoading,
  };
};
