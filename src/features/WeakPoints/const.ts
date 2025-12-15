// 정답률에 따른 색상
export const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-[var(--success)]'
    if (accuracy >= 60) return 'text-[var(--warning)]'
    return 'text-[var(--error)]'
}