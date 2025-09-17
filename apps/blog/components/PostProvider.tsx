'use client';
import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Post } from "@/tcb/models/post";
import { getPostList } from "@/tcb/models/post";

export const postContext = createContext<{
  loading: boolean;
  records: Post[];
  total: number | undefined;
  pageNumber: number;
  hasMore: boolean;
  loadMore: () => void;
} | null>(null);


export default function PostProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Post[]>([]);
  const [total, setTotal] = useState<number | undefined>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const hasMore = useMemo(
    () => records.length < (total || 0),
    [records, total]
  );
  const query = async () => {
    setLoading(true);
    const data = await getPostList(pageNumber);
    const { records: newRecords = [], total: newTotal } = data;
    setRecords([...records, ...newRecords]);
    setTotal(newTotal);
    setLoading(false);
  };
  const loadMore = () => {
    if (hasMore) {
      setPageNumber(pageNumber + 1);
    }
  };
  useEffect(() => {
    query();
  }, [pageNumber]);
  return (
    <postContext.Provider
      value={{ loading, records, total, pageNumber, hasMore, loadMore }}
    >
      {children}
    </postContext.Provider>
  );
}

export const usePost = () => {
  const context = useContext(postContext);
  if (!context) {
    throw new Error("usePost must be used within a PostProvider");
  }
  return context;
};
