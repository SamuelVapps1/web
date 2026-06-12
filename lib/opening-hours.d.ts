export declare const OPENING_HOURS: {
  readonly workdays: readonly [1, 2, 3, 4, 5];
  readonly blocks: readonly [
    { readonly start: '10:00'; readonly end: '13:00' },
    { readonly start: '14:00'; readonly end: '18:00' },
  ];
  readonly lunchBreak: {
    readonly start: '13:00';
    readonly end: '14:00';
  };
  readonly dayStart: '10:00';
  readonly dayEnd: '18:00';
  readonly slotStepMinutes: 30;
};

export declare function buildWorkingDaySlots(): string[];
export declare function buildCalendarDaySlots(): string[];
export declare function buildLunchBreakSlots(): string[];
export declare function isLunchBreakSlot(timeKey: string): boolean;
