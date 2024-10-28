export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container mx-auto min-h-screen grid place-items-center">
      {children}
    </div>
  );
}
