import { useCallback, useState } from "react"

export const useModalState = () => {
    const [isOpen, setIsOpen] = useState<boolean>();

    const openModal = useCallback(() => setIsOpen(true),[]);
    const closeModal = useCallback(() => setIsOpen(false),[]);

    return {
        isOpen,
        openModal,
        closeModal
    }
}