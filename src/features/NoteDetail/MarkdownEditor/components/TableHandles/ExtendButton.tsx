/**
 * 테이블 확장 버튼 (행/열 추가)
 * 테이블 가장자리에 표시되는 납작한 버튼
 */
interface ExtendButtonProps {
  orientation: 'row' | 'col';
  onClick: () => void;
  tableWidth?: number;
  tableHeight?: number;
}

export function ExtendButton({ orientation, onClick, tableWidth, tableHeight }: ExtendButtonProps) {
  const isRow = orientation === 'row';

  return (
    <button
      className="flex items-center justify-center p-0 m-0 border-none rounded text-xs font-bold text-white bg-[var(--accent)] cursor-pointer transition-colors duration-150 hover:bg-[var(--accent-hover)]"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title={isRow ? '행 추가' : '열 추가'}
      style={
        isRow
          ? { width: tableWidth ?? '100%', height: 12 }
          : { width: 12, height: tableHeight ?? '100%' }
      }
    >
      +
    </button>
  );
}
