import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { TopicSummary } from '../../types';
import { CategoryCard } from '../common/CategoryCard';

interface CategoryBrowserScreenProps {
  onClose?: () => void;
}

export const CategoryBrowserScreen: React.FC<CategoryBrowserScreenProps> = ({
  onClose,
}) => {
  const {
    room,
    player,
    categoryGroups,
    topics,
    startGame,
    toggleAllowedTopic,
    setAllowedTopicIdsList,
    audio,
    haptic,
  } = useGame();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopicForInfo, setSelectedTopicForInfo] = useState<TopicSummary | null>(null);

  // التحكم في فتح وغلق الأقسام
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    science: true,
    general: true,
    sports: false,
    celebrities_arts: false,
  });

  const isHost = player?.isHost;
  const playersCount = room?.players?.length || 1;

  // المواضيع المحددة حالياً
  const allowedTopicIds = useMemo(() => {
    if (room?.allowedTopicIds && room.allowedTopicIds.length > 0) {
      return new Set(room.allowedTopicIds);
    }
    return new Set(topics.map((t) => t.id));
  }, [room?.allowedTopicIds, topics]);

  const toggleCategoryExpand = (catId: string) => {
    audio.playClick();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleRandomizeSelection = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    const allIds = topics.map((t) => t.id);
    if (allIds.length === 0) return;

    const shuffled = [...allIds].sort(() => 0.5 - Math.random());
    const randomCount = Math.min(allIds.length, Math.max(3, Math.floor(Math.random() * 4) + 4));
    const picked = shuffled.slice(0, randomCount);
    setAllowedTopicIdsList(picked);
  };

  const handleSelectAll = () => {
    audio.playClick();
    haptic.triggerHaptic('success');
    const allIds = topics.map((t) => t.id);
    setAllowedTopicIdsList(allIds);
  };

  const handleDeselectAll = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    setAllowedTopicIdsList([]);
  };

  // فلترة حسب البحث
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return categoryGroups;
    const query = searchQuery.trim().toLowerCase();

    return categoryGroups
      .map((g) => ({
        ...g,
        subtopics: (g.subtopics || []).filter(
          (t: TopicSummary) =>
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query)
        ),
      }))
      .filter((g) => (g.subtopics && g.subtopics.length > 0) || g.title.toLowerCase().includes(query));
  }, [categoryGroups, searchQuery]);

  return (
    <div className="h-full max-h-full overflow-y-auto table-canvas-dark text-on-surface flex flex-col justify-between selection:bg-surface-bright selection:text-white pb-10">
      {/* نافذة تفاصيل الموضوع */}
      {selectedTopicForInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setSelectedTopicForInfo(null)}
        >
          <div
            className="w-full max-w-md dark-monochrome-card rounded-3xl p-6 border border-white/10 text-right space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-white">menu_book</span>
                <h3 className="text-lg font-bold text-white">{selectedTopicForInfo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicForInfo(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              {selectedTopicForInfo.description}
            </p>

            <div className="flex items-center justify-between text-xs text-outline font-medium">
              <span>عدد الألغاز: {selectedTopicForInfo.puzzleCount}</span>
              <span>الحالة: {allowedTopicIds.has(selectedTopicForInfo.id) ? 'نشط ✔' : 'غير نشط'}</span>
            </div>
          </div>
        </div>
      )}

      {/* الرأس العلوي */}
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/40">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-white border border-outline-variant/40 transition-all"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] rotate-180">arrow_back</span>
              </button>
            ) : null}
            <div>
              <h1 className="text-sm sm:text-lg font-bold text-white">مستعرض الحزم والتصنيفات</h1>
              <p className="text-[10px] sm:text-xs text-on-surface-variant">تخصيص بنك الأسئلة المتاح في الغرفة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-surface-container-high border border-outline-variant/60 text-[11px] sm:text-xs font-bold text-white">
              {allowedTopicIds.size} نشطة
            </span>
          </div>
        </div>
      </header>

      {/* الحاوية الرئيسية */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full space-y-4 sm:space-y-6">
        {/* شريط البحث والإجراءات السريعة */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن تصنيف أو موضوع..."
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pr-9 pl-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition-all"
            />
            <span className="material-symbols-outlined absolute right-2.5 top-2 sm:top-2.5 text-[18px] sm:text-[20px] text-outline">
              search
            </span>
          </div>

          {isHost && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleRandomizeSelection}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">casino</span>
                <span>عشوائي</span>
              </button>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white text-surface-container-lowest text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">done_all</span>
                <span>تحديد الكل</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-on-surface-variant hover:text-rose-400 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">deselect</span>
                <span>إلغاء الكل</span>
              </button>
            </div>
          )}
        </div>

        {/* قائمة مجموعات الفئات */}
        <div className="space-y-3 sm:space-y-4">
          {filteredGroups.map((group) => {
            const isExpanded = !!expandedCategories[group.id];
            const groupTopics = group.subtopics || [];
            const activeInGroup = groupTopics.filter((t) => allowedTopicIds.has(t.id)).length;

            return (
              <div
                key={group.id}
                className="border border-outline-variant/50 rounded-xl sm:rounded-2xl bg-surface-container-low overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleCategoryExpand(group.id)}
                  className="w-full p-3.5 sm:p-5 flex items-center justify-between text-right hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-white shrink-0">
                      <span className="material-symbols-outlined text-[18px] sm:text-[22px]">
                        {group.id === 'science'
                          ? 'science'
                          : group.id === 'sports'
                          ? 'sports_soccer'
                          : 'psychology'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-sm sm:text-base font-bold text-white">{group.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">
                          {groupTopics.reduce((acc: number, t: TopicSummary) => acc + (t.puzzleCount || 0), 0)} بطاقة
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-on-surface-variant mt-0.5 line-clamp-1">{group.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] sm:text-xs font-bold text-white bg-surface-container px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-outline-variant/40 shrink-0">
                      {activeInGroup}/{groupTopics.length} مفعلة
                    </span>
                    <span
                      className={`material-symbols-outlined text-[18px] sm:text-[20px] text-on-surface-variant transform transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-outline-variant/30">
                    <p className="text-[11px] text-on-surface-variant mb-3 font-medium">
                      الفئات الفرعية المضمنة:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {groupTopics.map((topic: TopicSummary) => (
                        <CategoryCard
                          key={topic.id}
                          topic={topic}
                          isSelected={allowedTopicIds.has(topic.id)}
                          onToggle={() => isHost && toggleAllowedTopic(topic.id)}
                          onShowInfo={(t) => setSelectedTopicForInfo(t)}
                          disabled={!isHost}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* الشريط السفلي الثابت */}
      <footer className="fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-2xl py-3.5 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            {allowedTopicIds.size} تصنيفات نشطة جاهزة للعبة
          </span>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-neutral-200 text-surface-container-lowest font-bold text-xs py-2 px-6 rounded-xl transition-all shadow-sm"
            >
              تم والعودة
            </button>
          ) : isHost ? (
            <button
              type="button"
              onClick={startGame}
              disabled={playersCount < 2}
              className="bg-white hover:bg-neutral-200 text-surface-container-lowest font-bold text-xs py-2 px-6 rounded-xl transition-all shadow-sm disabled:opacity-40"
            >
              بدء اللعبة الآن
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
};
