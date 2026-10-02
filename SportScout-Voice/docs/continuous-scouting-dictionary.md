# SportScout Voice: continuous scouting dictionary

Status: implemented parser; real Thai microphone latency NOT VERIFIED. Simulation fixtures are tests only and never seed a session.

## badminton

| Canonical action | Spoken synonyms |
|---|---|
| Serve | เสิร์ฟ, เสิรฟ, เสิฟ, เสิร์ฟสั้น, เสิร์ฟยาว, เสิร์ฟสูง, เสิร์ฟสะบัด, เสิร์ฟแบ็กแฮนด์ |
| Return | รับเสิร์ฟ, รีเทิร์น, รับลูกเสิร์ฟ |
| Clear | เคลียร์, เคลีย, ตีโด่ง, ตีลูกโด่ง, ตีไปท้ายคอร์ต |
| Drop | หยอด, ดรอป, ดร็อป, ตัดหยอด, หยอดเร็ว, หยอดช้า |
| Smash | ตบ, สแมช, สแมชช์, ตบเร็ว, ตบหนัก, กระโดดตบ, ตบเฉียง, ตบตรง |
| Drive | ไดรฟ์, ไดร์ฟ, ดาด, ตีดาด |
| Lift | ยก, งัด, ยกลูก, ยกกลับ, งัดขึ้น |
| Net Shot | วางหน้าเน็ต, เล่นหน้าเน็ต, ลูกหน้าเน็ต, ปั่นหน้าเน็ต |
| Net Kill | เน็ตกิล, เน็ตคิล, ซ้ำหน้าเน็ต, ตบหน้าเน็ต, ฆ่าหน้าเน็ต |
| Block | บล็อก, บล็อค, บล็อคตบ, กันตบ |

## volleyball

| Canonical action | Spoken synonyms |
|---|---|
| Serve | เสิร์ฟ, เสิรฟ, เสิฟ, เสิร์ฟลอย, เสิร์ฟโฟลต, เสิร์ฟจัมพ์โฟลต, กระโดดเสิร์ฟ, เสิร์ฟท็อปสปิน, เสิร์ฟสั้น, เสิร์ฟยาว |
| Reception | รับบอลแรก, รับเสิร์ฟ, รับลูกเสิร์ฟ, บอลแรก, รีเซฟ, รีเซฟชั่น, รับ |
| Set | เซ็ต, เซต, เซ็ท, ตั้งบอล, จ่ายบอล, เซ็ตบอลเร็วกลาง, เซ็ตเร็ว, เซ็ตสูง, เซ็ตหัวเสา, เซ็ตกลับหลัง, แบ็กเซ็ต, เซ็ตบอลสอง |
| Attack | ตบ, ตบเร็ว, ตบลง, สไปค์, สปाइक, ตีบอลเร็ว, บอลเร็ว, บอลสั้น, บอลบี, บอลไหล, ตบหัวเสา, ตบสามเมตร, ตบหลัง, หยอด, ทิป, แตะหยอด, ตีทัช, ตบอัดบล็อก |
| Block | บล็อก, บล็อค, สกัด, บล็อกเดี่ยว, บล็อกคู่, บล็อกสามคน, บล็อกแต้ม |
| Dig | ขุด, ดิก, รับตบ, รับลูกตบ, พุ่งรับ, เซฟบอล, รับเกมรับ |
| Free Ball | ฟรีบอล, ส่งฟรีบอล, ส่งบอลข้าม |
| Cover | คัฟเวอร์, คัฟเว่อร์, คัฟเวอ, รองบอล, รองบล็อก, รองตบ |
| Overpass | บอลล้น, รับล้น, บอลแรกข้าม, รับข้ามเน็ต |
| Error | ผิดพลาด, ทำเสีย, ฟาวล์, ผิดตำแหน่ง, สัมผัสเน็ต, เหยียบเส้น, บอลสี่จังหวะ, จับบอล, เล่นสองครั้ง |

## Field categories

```json
{
  "actors": {
    "A": [
      "A",
      "เอ",
      "ทีมเอ",
      "ทีม เอ",
      "ทีม A",
      "ฝั่งเอ",
      "ฝั่ง เอ",
      "ฝั่ง A"
    ],
    "B": [
      "B",
      "บี",
      "ทีมบี",
      "ทีม บี",
      "ทีม B",
      "ฝั่งบี",
      "ฝั่ง บี",
      "ฝั่ง B"
    ]
  },
  "identity": {
    "jersey": [
      "เบอร์",
      "หมายเลข",
      "#",
      "number"
    ],
    "roles": [
      "ตัวเซ็ต",
      "เซ็ตเตอร์",
      "ลิเบอโร",
      "หัวเสา",
      "บอลเร็ว",
      "บีหลัง",
      "ตัวรับอิสระ"
    ]
  },
  "spatial": {
    "origin": [
      "จาก",
      "อยู่",
      "ยืน",
      "ตำแหน่ง",
      "ที่"
    ],
    "target": [
      "ไป",
      "ลง",
      "เป้าหมาย",
      "ตก",
      "to"
    ],
    "badminton": {
      "Front Left": [
        "หน้าซ้าย",
        "ซ้ายหน้า",
        "หน้า ซ้าย"
      ],
      "Front Center": [
        "หน้ากลาง",
        "กลางหน้า"
      ],
      "Front Right": [
        "หน้าขวา",
        "ขวาหน้า",
        "หน้า ขวา"
      ],
      "Mid Left": [
        "กลางซ้าย",
        "ซ้ายกลาง"
      ],
      "Mid Center": [
        "กลางสนาม",
        "กลางคอร์ด",
        "กลางคอร์ต",
        "กลางกลาง"
      ],
      "Mid Right": [
        "กลางขวา",
        "ขวากลาง"
      ],
      "Rear Left": [
        "หลังซ้าย",
        "ซ้ายหลัง",
        "หลัง ซ้าย"
      ],
      "Rear Center": [
        "หลังกลาง",
        "กลางหลัง"
      ],
      "Rear Right": [
        "หลังขวา",
        "ขวาหลัง",
        "หลัง ขวา"
      ]
    },
    "volleyball": [
      "โซน 1",
      "โซน 2",
      "โซน 3",
      "โซน 4",
      "โซน 5",
      "โซน 6"
    ]
  },
  "reception": {
    "0": [
      "รับศูนย์",
      "รับ 0",
      "เกรดศูนย์",
      "คุณภาพศูนย์"
    ],
    "1": [
      "รับหนึ่ง",
      "รับ 1",
      "เกรดหนึ่ง",
      "คุณภาพหนึ่ง"
    ],
    "2": [
      "รับสอง",
      "รับ 2",
      "เกรดสอง",
      "คุณภาพสอง"
    ],
    "3": [
      "รับสาม",
      "รับ 3",
      "เกรดสาม",
      "คุณภาพสาม"
    ]
  },
  "outcome": {
    "point": [
      "ได้แต้ม",
      "ได้หนึ่ง",
      "ได้หนึ่งแต้ม",
      "บวกหนึ่ง",
      "บวก 1",
      "+1",
      "+ 1",
      "เป็นแต้ม",
      "winner"
    ],
    "ace": [
      "เอซ",
      "ได้เอซ",
      "ace"
    ],
    "kill": [
      "คิล",
      "kill"
    ],
    "error": [
      "เสียแต้ม",
      "เสียเอง",
      "ติดเน็ต",
      "ออก",
      "ตีออก",
      "เสิร์ฟเสีย",
      "เสิร์ฟออก"
    ],
    "blocked": [
      "ติดบล็อก",
      "โดนบล็อก",
      "ถูกบล็อก"
    ]
  },
  "correction": [
    "เอ้ย",
    "เอ๊ย",
    "เฮ้ยไม่ใช่",
    "ไม่ใช่",
    "แก้เป็น",
    "เปลี่ยนเป็น",
    "ขอแก้",
    "หมายถึง"
  ],
  "hesitation": [
    "เอ่อ",
    "อ่า",
    "อืม",
    "คือ",
    "นะ",
    "ครับ",
    "ค่ะ",
    "เลย",
    "โอ้",
    "โอ้โห"
  ],
  "sequence": [
    "แล้ว",
    "จากนั้น",
    "ต่อด้วย",
    "ต่อไป",
    "แรลลี่ใหม่",
    "เริ่มแรลลี่",
    "จบแรลลี่"
  ],
  "subtypes": {
    "badminton": [
      "โฟร์แฮนด์",
      "แบ็กแฮนด์",
      "ตรง",
      "เฉียง",
      "ครอส",
      "สั้น",
      "ยาว",
      "สูง",
      "เร็ว",
      "ช้า"
    ],
    "volleyball": [
      "จัมพ์โฟลต",
      "โฟลต",
      "ท็อปสปิน",
      "อันเดอร์แฮนด์",
      "บอลเร็วกลาง",
      "บอลบี",
      "บอลไหล",
      "บอลสูง",
      "หัวเสา",
      "บีหลัง",
      "สามเมตร",
      "ตรง",
      "เฉียง",
      "ตีทัช",
      "หยอด",
      "บล็อกเดี่ยว",
      "บล็อกคู่"
    ]
  }
}
```

## Excited speech simulations

- A อยู่ขวาหน้า เอ้ยไม่ใช่ขวาหลัง แล้วหยอดไปหน้าซ้าย ได้หนึ่ง → one Drop, origin Rear Right, target Front Left, one A point.
- เอ ตบ ตบ ตบจากหลังขวาไปหน้าซ้าย ได้แต้ม ได้แต้ม บวกหนึ่ง → one Smash, one point.
- บี รับสาม เอ้ย รับสอง → Reception quality 2, no point.
- ทีม A เบอร์ 7 เสิร์ฟไปโซน 5 B รับสาม เซ็ตบอลเร็วกลาง เบอร์ 10 ตบลง ได้แต้ม → Serve/Reception/Set/Attack, one rally and one B point.
- เอ ตบติดบล็อก → Attack BLOCKED, point B; do not create a Block for the attacking team.
- หยอดได้แต้ม → actor unknown, review.
- บี รับ 99 → invalid quality, review; never clamp.
- เอ้ย หลังขวา after a just-finalized origin-only observation → edit that observation, not a new scoring event. Corrections that cannot identify a field require review.

## Connection and test limitations

Deepgram Nova-3 receives real PCM live. Long-lived API key is encrypted server-side. Browser receives a short-lived token via authenticated Site backend. Browser recognition is a clearly labelled experimental fallback. Token verification does not verify live STT model access or Thai accuracy.

Keep the page open and screen awake. Actual Android/iOS microphone selection, headset routing, background capture, field noise, connectivity interruptions and full-match uptime require real-device tests. No speed/accuracy SLA is claimed.

Interim tags/cues are provisional. Only finalized, validated observations feed official score/stats/heatmap. Unknown text uses the asynchronous AI/review queue while capture continues. Reconnect gaps are explicitly reported; uninterrupted capture through arbitrary outages is not guaranteed.
