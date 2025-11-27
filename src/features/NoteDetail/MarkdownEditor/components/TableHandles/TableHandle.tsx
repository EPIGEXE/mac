/**
 * 테이블 행/열 핸들 버튼
 * 클릭 시 행/열 전체 선택 + 컨텍스트 메뉴 표시 (BlockNote 스타일)
 */
import { useRef, useCallback } from 'react';

interface TableHandleProps {
  orientation: 'row' | 'col';
  onSelect: () => void;
  onOpenMenu: (anchorRect: DOMRect) => void;
}

export function TableHandle({
  orientation,
  onSelect,
  onOpenMenu,
}: TableHandleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 클릭: 행/열 전체 선택 + 메뉴 열기
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    if (buttonRef.current) {
      onOpenMenu(buttonRef.current.getBoundingClientRect());
    }
  }, [onSelect, onOpenMenu]);

  const isCol = orientation === 'col';
  const isRow = orientation === 'row';

  return (
    <button
      ref={buttonRef}
      className={`table-handle table-handle-${orientation} flex items-center justify-center min-w-[18px] min-h-[18px] p-0 m-0 border border-[var(--border-light)] rounded-[3px] bg-[var(--bg-secondary)] cursor-pointer text-[10px] text-[var(--text-tertiary)] transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${
        isCol ? 'w-full max-h-[18px]' : 'h-full max-w-[18px]'
      }`}
      onClick={handleClick}
      title={isRow ? '행 옵션' : '열 옵션'}
    >
      ⠿
    </button>
  );
}
