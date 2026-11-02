// 範例資料（內容取自 測試輸出_大阪京都.docx），用於自動測試與 Word 驗證

import type { Booklet } from './booklet'

const lorem = (name: string) =>
  `（測試內容）${name}的介紹文字，約兩到三行，用來確認段落格式、字型和換行是否正確。這裡再多寫一些字讓它換行。`

export const osakaKyoto: Booklet = {
  flights: [
    { date: '2026-12-01', airline: '中華航空', flightNo: 'CI152', from: '高雄', departTime: '08:00', to: '大阪關西', arriveTime: '11:45' },
    { date: '2026-12-04', airline: '中華航空', flightNo: 'CI153', from: '大阪關西', departTime: '12:45', to: '高雄', arriveTime: '14:50' },
  ],
  days: [
    {
      date: '2026-12-01',
      overview: '',
      theme: '',
      departTime: '',
      spots: [
        { name: '大阪城公園', content: lorem('大阪城公園') },
        { name: '道頓堀', content: lorem('道頓堀') },
      ],
    },
    {
      date: '2026-12-02',
      overview: '京都一日遊',
      theme: '',
      departTime: '',
      spots: [
        { name: '伏見稻荷大社', content: lorem('伏見稻荷大社') },
        { name: '清水寺', content: lorem('清水寺') },
        { name: '祇園花見小路', content: lorem('祇園花見小路') },
      ],
    },
    {
      date: '2026-12-03',
      overview: '',
      theme: '',
      departTime: '',
      spots: [
        { name: '黑門市場', content: lorem('黑門市場') + '\n第二行：測試換行。\n第三行：再測一次。' },
        { name: '新世界通天閣', content: lorem('新世界通天閣') },
      ],
    },
    {
      date: '2026-12-04',
      overview: '臨空城 Outlet 購物後前往機場',
      theme: '',
      departTime: '',
      spots: [{ name: '臨空城 Outlet', content: lorem('臨空城 Outlet') }],
    },
  ],
  foods: [
    {
      place: '大阪',
      items: [
        { name: '章魚燒', description: '測試說明一。' },
        { name: '大阪燒', description: '測試說明二。\n第二行說明。' },
      ],
    },
    {
      place: '京都',
      items: [
        { name: '抹茶甜點', description: '測試說明三。' },
        { name: '京漬物', description: '測試說明四。' },
        { name: '湯豆腐', description: '測試說明五。' },
      ],
    },
  ],
  hotels: [
    { name: '大阪難波測試飯店', address: '大阪市中央區難波1-1-1', phone: '06-0000-0000', city: '', checkIn: '', checkOut: '' },
    { name: '京都四條測試飯店', address: '京都市下京區（測試）', phone: '075-000-0000', city: '', checkIn: '', checkOut: '' },
  ],
  hotelNote: '',
  infos: [
    { title: '氣候', content: '（測試）氣候的說明內容。' },
    { title: '時差', content: '（測試）時差的說明內容。' },
    { title: '飲水', content: '（測試）飲水的說明內容。' },
    { title: '電壓插座', content: '（測試）電壓插座的說明內容。\n第二行：100V，雙平腳插座。' },
    { title: '緊急電話', content: '（測試）緊急電話的說明內容。' },
  ],
  checklist: [
    { category: '證件', item: 'Visit Japan Web QR' },
    { category: '衣物', item: '暖暖包' },
    { category: '衣物', item: '圍巾' },
    { category: '藥品', item: '腸胃藥' },
    { category: '其它', item: '行動電源' },
    { category: '其它', item: 'ICOCA卡' },
  ],
}

// 只有行程和旅遊資訊：航班、美食、飯店要整段隱藏；檢查清單項目多到要加列
export const sparse: Booklet = {
  flights: [],
  days: osakaKyoto.days.slice(0, 2),
  foods: [],
  hotels: [],
  hotelNote: '',
  infos: osakaKyoto.infos.slice(0, 3),
  checklist: [
    ...['日幣', '駕照譯本', '旅平險保單', '飯店訂房確認單'].map((item) => ({ category: '證件' as const, item })),
    ...Array.from({ length: 12 }, (_, i) => ({ category: '其它' as const, item: `其它項目${i + 1}` })),
  ],
}
