import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <SignIn
        appearance={{
          variables: {
            colorBackground: "#0C1B31",
            colorText: "#F5F8FF",
            colorPrimary: "#2E6BFF",
            colorInputBackground: "#07111F",
            colorInputText: "#F5F8FF"
          }
        }}
      />
    </main>
  );
}
