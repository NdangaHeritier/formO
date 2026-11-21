import BrandLoader from "./BrandLoader";

export default function LoadingSpinner({ customs = "h-screen", size }: { customs?: string; size?: number }) {
  return (
    <div className={`flex items-center justify-center ${customs || ""}`}>
      <BrandLoader size={size} />
    </div>
  );
}
