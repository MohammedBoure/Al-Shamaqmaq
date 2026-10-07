import React, { useState, useMemo } from 'react';
import {
  Search,
  Dice5,
  CheckCheck,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Gift,
  HelpCircle,
  FlaskConical,
  X,
  Play,
  ArrowRight,
  Info,
} from 'lucide-react';
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
  const [activeBottomTab, setActiveBottomTab] = useState<'game' | 'chat'>('game');
  const [selectedTopicForInfo, setSelectedTopicForInfo] = useState<TopicSummary | null>(null);

  // التحكم في فتح وغلق الأقسام (العلوم مفتوح افتراضياً كما في الصورة)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    science: true,
    variety: false,
    weekly: false,
    new_categories: false,
  });

  const isHost = player?.isHost;
  const playersCount = room?.players?.length || 1;
  const playersCountFormatted = String(playersCount).padStart(2, '0');

  // المواضيع المحددة حالياً
  const allowedTopicIds = useMemo(() => {
    if (room?.allowedTopicIds && room.allowedTopicIds.length > 0) {
      return new Set(room.allowedTopicIds);
    }
    // افتراضياً كل المواضيع محددة
    return new Set(topics.map((t) => t.id));
  }, [room?.allowedTopicIds, topics]);

  const selectedCountFormatted = String(allowedTopicIds.size).padStart(2, '0');

  // تفعيل / طي قسم فئة
  const toggleCategoryExpand = (catId: string) => {
    audio.playClick();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // اختيار عشوائي لـ 5 أو 6 فئات (Dice)
  const handleRandomizeSelection = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    const allIds = topics.map((t) => t.id);
    if (allIds.length === 0) return;

    // خلط عشوائي واختيار من 4 إلى 6 فئات
    const shuffled = [...allIds].sort(() => 0.5 - Math.random());
    const randomCount = Math.min(allIds.length, Math.max(3, Math.floor(Math.random() * 4) + 4));
    const picked = shuffled.slice(0, randomCount);
    setAllowedTopicIdsList(picked);
  };

  // اختيار جميع الفئات (الكل ✔)
  const handleSelectAll = () => {
    audio.playClick();
    haptic.triggerHaptic('success');
    const allIds = topics.map((t) => t.id);
    setAllowedTopicIdsList(allIds);
  };

  // تصفية: اختيار الفئات غير الـ VIP فقط أو إعادة الضبط
  const [filterVipOnly, setFilterVipOnly] = useState<boolean>(false);
  const handleToggleFilter = () => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setFilterVipOnly((prev) => !prev);
  };

  // أيقونات الفئات حسب نوعها
  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'weekly':
        return <Sparkles className="w-5 h-5 text-amber-950" />;
      case 'new_categories':
        return <Gift className="w-5 h-5 text-amber-950" />;
      case 'variety':
        return <HelpCircle className="w-5 h-5 text-white" />;
      case 'science':
      default:
        return <FlaskConical className="w-5 h-5 text-white" />;
    }
  };

  // تصفية المواضيع بناء على البحث
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim() && !filterVipOnly) {
      return categoryGroups;
    }

    const query = searchQuery.trim().toLowerCase();
    return categoryGroups
      .map((cat) => {
        const filteredSub = cat.subtopics.filter((sub) => {
          const matchQuery =
            !query ||
            sub.title.toLowerCase().includes(query) ||
            sub.description.toLowerCase().includes(query);
          const matchVip = !filterVipOnly || sub.is_vip;
          return matchQuery && matchVip;
        });

        return {
          ...cat,
          subtopics: filteredSub,
        };
      })
      .filter((cat) => cat.subtopics.length > 0);
  }, [categoryGroups, searchQuery, filterVipOnly]);

  const canStartGame = (room?.players?.length || 0) >= 2;

  const handleStartOrSave = () => {
    if (isHost && canStartGame) {
      startGame();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1b2245] bg-arcade-pattern text-white max-w-md mx-auto w-full relative select-none pb-32">
      {/* نافذة تفاصيل الموضوع المنبثقة عند الضغط على ℹ */}
      {selectedTopicForInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedTopicForInfo(null)}
        >
          <div
            className="w-full max-w-sm bg-[#1e2337] border-3 border-black rounded-3xl p-5 shadow-[0_8px_0_#000] text-right space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center border-2 border-black">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-black text-white">{selectedTopicForInfo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicForInfo(null)}
                className="p-1 rounded-xl bg-black/40 hover:bg-black text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              {selectedTopicForInfo.description}
            </p>

            <div className="flex items-center justify-between pt-2 text-xs font-bold text-gray-400">
              <span>الفئة: {selectedTopicForInfo.categoryTitle || 'عام'}</span>
              <span>عدد الألغاز: {selectedTopicForInfo.puzzleCount}</span>
            </div>

            {selectedTopicForInfo.is_vip && (
              <div className="bg-amber-400/20 border border-amber-400 rounded-xl p-2 text-center text-xs font-black text-amber-300">
                ⭐ هذه الفئة مميزة شارة VIP
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                toggleAllowedTopic(selectedTopicForInfo.id);
                setSelectedTopicForInfo(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#0070f3] text-white font-black text-xs border-2 border-black shadow-[0_3px_0_#0047a5] active:translate-y-0.5"
            >
              {allowedTopicIds.has(selectedTopicForInfo.id) ? 'إلغاء اختيار هذه الفئة' : 'تحديد هذه الفئة للعب'}
            </button>
          </div>
        </div>
      )}

      {/* زر العودة العلوي إذا كان معروضاً كشاشة فرعية */}
      {onClose && (
        <div className="px-4 pt-3 flex justify-between items-center z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-[#1e2337] border-2 border-black text-xs font-black text-white shadow-[0_2px_0_#000] flex items-center gap-1.5 hover:bg-[#282f49] active:translate-y-0.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع للغرفة</span>
          </button>
          <span className="text-xs font-black text-gray-300">تخصيص الفئات</span>
        </div>
      )}

      {/* رأس الشاشة: الشارات العلوية وشريط الفئات البنفسجي المطابق للتصميم */}
      <div className="flex flex-col items-center pt-4 mb-3 relative z-10 px-4">
        {/* البطاقات الثلاث المتدلية فوق الشريط */}
        <div className="flex items-end justify-center gap-1 -mb-2 relative z-10">
          {/* بطاقة الأسئلة الخضراء */}
          <div className="w-9 h-11 bg-[#10b981] border-2 border-black rounded-lg shadow-[0_2px_0_#000] transform -rotate-12 flex items-center justify-center">
            <span className="text-white font-black text-xs">??</span>
          </div>
          {/* بطاقة اللوح الأصفر */}
          <div className="w-10 h-13 bg-[#f59e0b] border-2 border-black rounded-lg shadow-[0_2px_0_#000] -translate-y-1 z-10 flex items-center justify-center">
            <span className="text-black font-black text-base">📋</span>
          </div>
          {/* بطاقة الكرة الحمراء */}
          <div className="w-9 h-11 bg-[#ef4444] border-2 border-black rounded-lg shadow-[0_2px_0_#000] transform rotate-12 flex items-center justify-center">
            <span className="text-white font-black text-xs">⚽</span>
          </div>
        </div>

        {/* شريط الفئات البنفسجي ثلاثي الأبعاد ذو الأجنحة */}
        <div className="relative w-64 max-w-full">
          {/* الجناح الأيمن */}
          <div className="absolute -right-3 top-2 w-6 h-9 bg-[#5b21b6] border-2 border-black transform skew-y-12 -z-10 rounded-sm shadow-[0_3px_0_#000]" />
          {/* الشريط الأوسط */}
          <div className="bg-[#8b5cf6] py-1.5 px-6 rounded-xl border-3 border-black shadow-[0_4px_0_#4c1d95] text-center">
            <h2 className="text-xl font-black text-white text-stroke-arcade tracking-wider drop-shadow-[0_2px_0_#000]">
              الفئات
            </h2>
          </div>
          {/* الجناح الأيسر */}
          <div className="absolute -left-3 top-2 w-6 h-9 bg-[#5b21b6] border-2 border-black transform -skew-y-12 -z-10 rounded-sm shadow-[0_3px_0_#000]" />
        </div>
      </div>

      {/* صندوق التحكم والبحث (تصفية / نرد / الكل + حقل البحث) */}
      <div className="px-4 mb-4">
        <div className="bg-[#3a4460] rounded-3xl border-3 border-black p-2.5 shadow-[0_5px_0_#000] space-y-2">
          {/* صف الأزرار الثلاثة */}
          <div className="grid grid-cols-3 gap-2">
            {/* زر تصفية */}
            <button
              type="button"
              onClick={handleToggleFilter}
              className={`py-2 px-1 rounded-xl border-2 border-black font-black text-xs flex items-center justify-center gap-1 shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all ${
                filterVipOnly
                  ? 'bg-amber-400 text-black'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>تصفية</span>
            </button>

            {/* زر النرد 🎲 */}
            <button
              type="button"
              onClick={handleRandomizeSelection}
              className="py-2 px-1 rounded-xl bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs flex items-center justify-center gap-1 shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all"
              title="اختيار عشوائي للفئات"
            >
              <Dice5 className="w-4 h-4 text-purple-600" />
            </button>

            {/* زر الكل ✔ */}
            <button
              type="button"
              onClick={handleSelectAll}
              className="py-2 px-1 rounded-xl bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs flex items-center justify-center gap-1 shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>الكل</span>
            </button>
          </div>

          {/* حقل البحث المطابق للتصميم */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن فئة"
              className="w-full py-2 pr-9 pl-4 bg-white border-2 border-black rounded-xl text-black font-bold text-xs placeholder:text-gray-400 focus:outline-none shadow-inner text-right"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* قائمة الفئات القابلة للطي (Accordions) */}
      <div className="px-4 space-y-3">
        {filteredGroups.map((category) => {
          const isExpanded = expandedCategories[category.id] ?? false;
          const subtopics = category.subtopics || [];

          // حساب عدد الفئات المحددة داخل هذا القسم
          const selectedInCat = subtopics.filter((sub) => allowedTopicIds.has(sub.id)).length;
          const badgeText = `${subtopics.length}/${selectedInCat}`;

          return (
            <div
              key={category.id}
              className="bg-[#3a4460] rounded-2xl border-3 border-black overflow-hidden shadow-[0_4px_0_#000]"
            >
              {/* شريط عنوان الفئة القابل للنقر */}
              <button
                type="button"
                onClick={() => toggleCategoryExpand(category.id)}
                className="w-full bg-[#2d354b] hover:bg-[#343e58] px-3 py-2.5 flex items-center justify-between text-white font-black text-sm border-b-2 border-black transition-colors"
              >
                {/* الجانب الأيمن: الأيقونة السداسية + اسم الفئة */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center shadow-[0_2px_0_#000]"
                    style={{ backgroundColor: category.color || '#f59e0b' }}
                  >
                    {getCategoryIcon(category.id)}
                  </div>
                  <span className="text-sm font-black">{category.title}</span>
                </div>

                {/* الجانب الأيسر: عداد الفئات + سهم التوسيع/الطي */}
                <div className="flex items-center gap-2">
                  <span className="bg-[#1e2337] px-2 py-0.5 rounded-lg border border-black text-[11px] font-mono font-bold text-gray-300">
                    {badgeText}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              </button>

              {/* شبكة بطاقات المواضيع عند فتح القسم */}
              {isExpanded && (
                <div className="p-3 bg-[#1e2337]/90">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {subtopics.map((topic) => {
                      const isSelected = allowedTopicIds.has(topic.id);
                      return (
                        <CategoryCard
                          key={topic.id}
                          topic={topic}
                          isSelected={isSelected}
                          onToggle={() => toggleAllowedTopic(topic.id)}
                          onShowInfo={(t) => setSelectedTopicForInfo(t)}
                        />
                      );
                    })}
                  </div>

                  {subtopics.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-400">
                      لا توجد فئات مطابقة للبحث داخل هذا القسم
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <HelpCircle className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-xs font-bold">لم يتم العثور على أي فئة مطابقة للبحث</p>
          </div>
        )}
      </div>

      {/* الشريط السفلي الثابت المطابق للصورة تماماً */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center">
        <div className="w-full max-w-md bg-[#0070f3] rounded-3xl border-3 border-black p-2.5 shadow-[0_6px_0_#0047a5] flex flex-col items-center">
          {/* سطر العداد: 06 فئات • 01 لاعبين */}
          <div className="text-white text-xs font-black tracking-wide text-stroke-sm mb-2 text-center">
            {selectedCountFormatted} فئات &nbsp;•&nbsp; {playersCountFormatted} لاعبين
          </div>

          {/* زر ابدأ اللعبة الأصفر الكبير ثلاثي الأبعاد */}
          {isHost ? (
            <button
              type="button"
              onClick={handleStartOrSave}
              disabled={!canStartGame}
              className={`w-full py-3.5 rounded-2xl font-black text-lg border-3 border-black transition-all flex items-center justify-center gap-2 ${
                canStartGame
                  ? 'arcade-btn-yellow text-black'
                  : 'bg-[#b89535] text-black/60 cursor-not-allowed opacity-75 shadow-[0_3px_0_#6d5516]'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>ابدأ اللعبة</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl arcade-btn-yellow text-black font-black text-base border-3 border-black flex items-center justify-center gap-2"
            >
              <span>متابعة</span>
            </button>
          )}
        </div>

        {/* كبسولة التبديل بين اللعبة والدردشة بالأسفل */}
        <div className="mt-2 flex items-center bg-[#1e2337] border-2 border-black rounded-full p-1 shadow-[0_3px_0_#000]">
          <button
            type="button"
            onClick={() => setActiveBottomTab('game')}
            className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
              activeBottomTab === 'game'
                ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            لعبة
          </button>
          <button
            type="button"
            onClick={() => setActiveBottomTab('chat')}
            className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
              activeBottomTab === 'chat'
                ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            دردشة
          </button>
        </div>
      </div>
    </div>
  );
};
