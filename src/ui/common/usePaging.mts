import { useState, useCallback, useMemo } from "react";

export type Item = {
  id: string;
  display: string;
  data: any;
  highlighted?: boolean;
  // action keymap?
};

const usePaging = (items: Item[], itemsPerPage: number) => {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = useMemo(
    () => Math.ceil(items.length / itemsPerPage),
    [items.length, itemsPerPage],
  );

  const paginatedItems = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [items, currentPage, itemsPerPage]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
  };
};

export default usePaging;
