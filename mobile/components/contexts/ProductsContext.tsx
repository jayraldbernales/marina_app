import React, { createContext, useContext, useState, ReactNode } from "react";

type ProductStatus = "active" | "inactive";
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: any;
}

interface ProductsContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(
  undefined
);

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within ProductsProvider");
  }
  return context;
};

interface ProductsProviderProps {
  children: ReactNode;
}

export const ProductsProvider: React.FC<ProductsProviderProps> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([
    // Your mock data here
    {
      id: "PROD-001",
      name: "Bangus",
      price: 480,
      stock: 25,
      status: "active",
      image: require("@/assets/img/bangus.jpg"),
    },
    // ... add other mocks
  ]);

  return (
    <ProductsContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};
