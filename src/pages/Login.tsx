import AuthFormController from "@/components/auth/AuthFormController";
import EnvironmentBanner from "@/components/EnvironmentBanner";

const Login = () => {
  return (
    <>
      <EnvironmentBanner />
      <AuthFormController isLogin={true} />
    </>
  );
};

export default Login;
