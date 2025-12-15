import { EssayModeIcon, SentenceModeIcon, WordModeIcon } from "../../components/icons/StudyModeIcons";
import type { StudyModeType } from "../Study/types";

// 모드별 아이콘 및 라벨
export const modeConfig: Record<StudyModeType, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
    word: { icon: <WordModeIcon size={16} />, label: '단어', color: 'text-blue-500', bgColor: 'bg-blue-500' },
    sentence: { icon: <SentenceModeIcon size={16} />, label: '문장', color: 'text-green-500', bgColor: 'bg-green-500' },
    essay: { icon: <EssayModeIcon size={16} />, label: '서술형', color: 'text-purple-500', bgColor: 'bg-purple-500' },
}