import { Resend } from 'resend'
import ka from '@/messages/ka.json'
import en from '@/messages/en.json'
import ru from '@/messages/ru.json'

export type AppLocale = 'ka' | 'en' | 'ru'

const catalogs = { ka, en, ru }
const SITE_URL = 'https://skirentfanatic.ge'
const TIMEZONE = 'Asia/Tbilisi'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const copy = {
  ka: {
    bookingSubject: (item: string) => `დაჯავშნის დასტური — ${item}`,
    lessonSubject: 'გაკვეთილის დაჯავშნის დასტური — Ski Rent Fanatic',
    staffBookingSubject: (name: string, item: string) => `ახალი ჯავშანი — ${name} — ${item}`,
    staffLessonSubject: (name: string) => `ახალი გაკვეთილი — ${name}`,
    greeting: (name: string) => `გამარჯობა, ${name}`,
    hello: 'გამარჯობა',
    bookingIntro: 'თქვენი ჯავშანი მიღებულია. ქვემოთ არის დაჯავშნის დეტალები.',
    lessonIntro: 'თქვენი გაკვეთილი დაჯავშნილია. ქვემოთ არის დეტალები.',
    staffIntro: 'საიტიდან ახალი ჯავშანი შემოვიდა.',
    reference: 'ჯავშნის ნომერი',
    fullName: 'სახელი და გვარი',
    days: 'დღეების რაოდენობა',
    day: 'დღე',
    daysWord: 'დღე',
    pendingNote: 'ჯავშანი მიღებულია და ჯერ დაუდასტურებელია. თუ დამატებითი ინფორმაცია დაგვჭირდება, დაგიკავშირდებით.',
    confirmedNote: 'ჯავშანი დადასტურებულია.',
    cancellation: 'ჯავშნის გაუქმების შემთხვევაში მოგვწერეთ ან დაგვირეკეთ ნომერზე +995 57761 41 51.',
    contact: 'კონტაქტი',
    address: 'მისამართი',
    website: 'ვებგვერდი',
    footer: 'Ski Rent Fanatic · გუდაური',
  },
  en: {
    bookingSubject: (item: string) => `Booking confirmation — ${item}`,
    lessonSubject: 'Lesson booking confirmation — Ski Rent Fanatic',
    staffBookingSubject: (name: string, item: string) => `New booking — ${name} — ${item}`,
    staffLessonSubject: (name: string) => `New lesson — ${name}`,
    greeting: (name: string) => `Hello, ${name}`,
    hello: 'Hello',
    bookingIntro: 'Your booking has been received. The details are below.',
    lessonIntro: 'Your lesson has been booked. The details are below.',
    staffIntro: 'A new booking was submitted on the website.',
    reference: 'Booking reference',
    fullName: 'Name',
    days: 'Number of days',
    day: 'day',
    daysWord: 'days',
    pendingNote: 'Your booking has been received and is not confirmed yet. We will contact you if we need anything else.',
    confirmedNote: 'Your booking is confirmed.',
    cancellation: 'To cancel, text or call us at +995 57761 41 51.',
    contact: 'Contact',
    address: 'Address',
    website: 'Website',
    footer: 'Ski Rent Fanatic · Gudauri',
  },
  ru: {
    bookingSubject: (item: string) => `Подтверждение бронирования — ${item}`,
    lessonSubject: 'Подтверждение бронирования урока — Ski Rent Fanatic',
    staffBookingSubject: (name: string, item: string) => `Новое бронирование — ${name} — ${item}`,
    staffLessonSubject: (name: string) => `Новый урок — ${name}`,
    greeting: (name: string) => `Здравствуйте, ${name}`,
    hello: 'Здравствуйте',
    bookingIntro: 'Ваше бронирование получено. Детали ниже.',
    lessonIntro: 'Ваш урок забронирован. Детали ниже.',
    staffIntro: 'С сайта поступило новое бронирование.',
    reference: 'Номер бронирования',
    fullName: 'Имя и фамилия',
    days: 'Количество дней',
    day: 'день',
    daysWord: 'дн.',
    pendingNote: 'Бронирование получено и ещё не подтверждено. Мы свяжемся с вами, если понадобятся дополнительные данные.',
    confirmedNote: 'Бронирование подтверждено.',
    cancellation: 'Чтобы отменить бронирование, напишите или позвоните нам: +995 57761 41 51.',
    contact: 'Контакты',
    address: 'Адрес',
    website: 'Сайт',
    footer: 'Ski Rent Fanatic · Гудаури',
  },
} as const

export type RentalProduct = {
  type: string
  size?: string | null
  description?: string | null
  standard?: boolean | null
  professional?: boolean | null
}

export type RentalEmailInput = {
  locale?: unknown
  to: string
  firstName: string
  lastName: string
  phoneNumber: string
  bookingId: string
  status: string
  startDate: Date
  endDate: Date
  startTime?: string | null
  duration?: number | null
  numberOfPeople?: string | null
  totalPrice: number
  products: RentalProduct[]
}

export type LessonRecipient = {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
}

export type LessonEmailInput = {
  locale?: unknown
  bookingId: string
  status: string
  recipients: LessonRecipient[]
  lessonType: string
  level: string
  language: string
  date: Date
  startTime: string
  duration: number
  numberOfPeople: number
  totalPrice: number
  teacherName?: string | null
}

type Detail = { label: string; value: string }

let resendClient: Resend | null = null
let resendKey: string | null = null

export function normalizeLocale(value: unknown): AppLocale {
  if (value === 'ka' || value === 'en' || value === 'ru') return value
  return 'en'
}

function getResend(apiKey: string) {
  if (!resendClient || resendKey !== apiKey) {
    resendClient = new Resend(apiKey)
    resendKey = apiKey
  }
  return resendClient
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function oneLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function clip(value: string, max = 90) {
  const clean = oneLine(value)
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

function localeTag(locale: AppLocale) {
  if (locale === 'ka') return 'ka-GE'
  if (locale === 'ru') return 'ru-RU'
  return 'en-GB'
}

function formatDate(date: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatMoney(amount: number, locale: AppLocale) {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency: 'GEL',
    maximumFractionDigits: 2,
  }).format(amount)
}

function calendarKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function rentalDays(start: Date, end: Date) {
  const [sy, sm, sd] = calendarKey(start).split('-').map(Number)
  const [ey, em, ed] = calendarKey(end).split('-').map(Number)
  const diff = Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)
  return Math.floor(diff / 86400000) + 1
}

function labels(locale: AppLocale) {
  const messages = catalogs[locale]
  const lessons = messages.lessons as Record<string, string>
  const equipmentTypes = messages.admin.equipment.types as Record<string, string>
  const statuses = messages.admin.bookings.status as Record<string, string>

  return {
    equipment: messages.admin.bookings.form.equipment,
    dates: messages.admin.bookings.form.dates,
    price: messages.admin.bookings.form.price,
    phone: messages.admin.bookings.form.phone,
    email: messages.admin.bookings.form.email,
    statusLabel: messages.admin.bookings.form.status,
    people: messages.admin.bookings.form.numberOfPeople,
    date: lessons.date,
    startTime: lessons.startTime,
    duration: lessons.duration,
    lessonType: lessons.lessonType,
    level: lessons.level,
    teacher: lessons.teacher,
    language: lessons.language,
    participant: lessons.participant,
    hour: lessons.hour,
    hours: lessons.hours,
    person: lessons.person,
    peopleWord: lessons.people,
    shopPhone: messages.footer.phone,
    shopEmail: messages.footer.email,
    location: messages.footer.location,
    standard: messages.admin.equipment.form.standard,
    professional: messages.admin.equipment.form.professional,
    status: (value: string) => statuses[value.toLowerCase()] || value,
    productType: (type: string) => equipmentTypes[type] || type.replace(/_/g, ' '),
    lessonTypeValue: (type: string) => (type === 'SNOWBOARD' ? lessons.snowboard : lessons.ski),
    levelValue: (level: string) => lessons[level.toLowerCase()] || level,
    languageValue: (language: string) => lessons[language.toLowerCase()] || language,
  }
}

function formatProduct(locale: AppLocale, product: RentalProduct) {
  const text = labels(locale)
  let name = text.productType(product.type)
  if (product.description) name += ` (${product.description})`
  if (product.size) name += ` — ${product.size}`
  const badges = [
    product.standard ? text.standard : '',
    product.professional ? text.professional : '',
  ].filter(Boolean)
  if (badges.length > 0) name += ` (${badges.join(', ')})`
  return name
}

function durationLabel(locale: AppLocale, hours: number) {
  const text = labels(locale)
  return `${hours} ${hours === 1 ? text.hour : text.hours}`
}

function peopleLabel(locale: AppLocale, count: number) {
  const text = labels(locale)
  return `${count} ${count === 1 ? text.person : text.peopleWord}`
}

function daysLabel(locale: AppLocale, count: number) {
  const text = copy[locale]
  return `${count} ${count === 1 ? text.day : text.daysWord}`
}

function statusNote(locale: AppLocale, status: string) {
  if (status === 'PENDING') return copy[locale].pendingNote
  if (status === 'CONFIRMED') return copy[locale].confirmedNote
  return null
}

function renderEmail(options: {
  locale: AppLocale
  preheader: string
  title: string
  intro: string
  details: Detail[]
  note?: string | null
}) {
  const text = copy[options.locale]
  const siteLabels = labels(options.locale)
  const rows = options.details
    .map(
      (detail) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:42%;vertical-align:top;">${escapeHtml(detail.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111111;font-size:15px;font-weight:600;vertical-align:top;">${escapeHtml(detail.value)}</td>
      </tr>`
    )
    .join('')

 

  const html = `<!DOCTYPE html>
<html lang="${options.locale}">
  <body style="margin:0;padding:0;background:#fffafa;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffafa;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f3f4f6;">
            <tr>
              <td style="background:#f97316;padding:22px 28px;">
                <div style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Ski Rent Fanatic</div>
                <div style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;margin-top:6px;">${escapeHtml(options.title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;color:#111111;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${escapeHtml(options.intro)}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
               
                <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#374151;">${escapeHtml(text.cancellation)}</p>
                <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#374151;">
                  <strong>${escapeHtml(text.contact)}</strong><br />
                  ${escapeHtml(text.address)}: ${escapeHtml(siteLabels.location)}<br />
                  <a href="tel:+995577614151" style="color:#ea580c;text-decoration:none;">${escapeHtml(siteLabels.shopPhone)}</a><br />
                  <a href="mailto:${escapeHtml(siteLabels.shopEmail)}" style="color:#ea580c;text-decoration:none;">${escapeHtml(siteLabels.shopEmail)}</a><br />
                  ${escapeHtml(text.website)}: <a href="${SITE_URL}" style="color:#ea580c;text-decoration:none;">skirentfanatic.ge</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 22px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">${escapeHtml(text.footer)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const plain = [
    options.title,
    '',
    options.intro,
    '',
    ...options.details.map((detail) => `${detail.label}: ${detail.value}`),
    '',
    options.note || '',
    '',
    text.cancellation,
    '',
    `${text.contact}`,
    `${text.address}: ${siteLabels.location}`,
    siteLabels.shopPhone,
    siteLabels.shopEmail,
    SITE_URL,
  ]
    .filter((line) => line !== '')
    .join('\n')

  return { html, text: plain }
}

async function deliver(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.RESEND_FROM_EMAIL?.trim()
  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY or RESEND_FROM_EMAIL is missing; confirmation email was not sent')
    return false
  }
  if (!EMAIL_RE.test(to)) {
    console.warn('[email] Skipping confirmation because the address is invalid')
    return false
  }

  const replyTo = process.env.RESEND_REPLY_TO?.trim() || catalogs.ka.footer.email
  const { error } = await getResend(apiKey).emails.send({
    from,
    to,
    replyTo,
    subject: clip(subject, 140),
    html,
    text,
  })

  if (error) {
    console.error('[email] Resend rejected the confirmation', error)
    return false
  }
  return true
}

async function notifyShop(toCustomer: string, subject: string, html: string, text: string) {
  const notify = process.env.RESEND_NOTIFY_EMAIL?.trim()
  if (!notify || notify.toLowerCase() === toCustomer.toLowerCase()) return
  const sent = await deliver(notify, subject, html, text)
  if (!sent) {
    console.error('[email] Shop notification was not sent')
  }
}

function rentalDetails(input: RentalEmailInput, locale: AppLocale): Detail[] {
  const text = copy[locale]
  const site = labels(locale)
  const equipment = input.products.map((product) => formatProduct(locale, product)).join(', ') || '—'
  const sameDay = calendarKey(input.startDate) === calendarKey(input.endDate)
  const dates = sameDay
    ? formatDate(input.startDate, locale)
    : `${formatDate(input.startDate, locale)} – ${formatDate(input.endDate, locale)}`
  const people = Number.parseInt(input.numberOfPeople || '', 10)
  const details: Detail[] = [
    { label: text.reference, value: input.bookingId },
    { label: text.fullName, value: `${input.firstName} ${input.lastName}`.trim() },
    { label: site.phone, value: input.phoneNumber },
    { label: site.email, value: input.to },
    { label: site.equipment, value: equipment },
    { label: site.dates, value: dates },
    { label: text.days, value: daysLabel(locale, rentalDays(input.startDate, input.endDate)) },
  ]

  if (input.startTime) details.push({ label: site.startTime, value: input.startTime })
  if (input.duration && input.duration > 0) {
    details.push({ label: site.duration, value: durationLabel(locale, input.duration) })
  }
  if ((input.startTime || input.duration) && Number.isFinite(people) && people > 0) {
    details.push({ label: site.people, value: peopleLabel(locale, people) })
  } else if (Number.isFinite(people) && people > 1) {
    details.push({ label: site.people, value: peopleLabel(locale, people) })
  }

  details.push(
    { label: site.price, value: formatMoney(input.totalPrice, locale) },
    { label: site.statusLabel, value: site.status(input.status) }
  )

  return details
}

export async function sendRentalBookingEmail(input: RentalEmailInput) {
  try {
    if (input.status === 'CANCELLED') return false
    const locale = normalizeLocale(input.locale)
    const text = copy[locale]
    const equipment = input.products.map((product) => formatProduct(locale, product)).join(', ') || '—'
    const customerName = `${input.firstName} ${input.lastName}`.trim()
    const customer = renderEmail({
      locale,
      preheader: text.bookingIntro,
      title: text.greeting(customerName || text.hello),
      intro: text.bookingIntro,
      details: rentalDetails(input, locale),
      note: statusNote(locale, input.status),
    })

    const sent = await deliver(
      input.to.trim(),
      text.bookingSubject(equipment),
      customer.html,
      customer.text
    )

    const staffLocale: AppLocale = 'ka'
    const staffEquipment = input.products.map((product) => formatProduct(staffLocale, product)).join(', ') || '—'
    const staff = renderEmail({
      locale: staffLocale,
      preheader: copy.ka.staffIntro,
      title: copy.ka.staffIntro,
      intro: copy.ka.staffIntro,
      details: rentalDetails(input, staffLocale),
      note: null,
    })
    await notifyShop(
      input.to,
      copy.ka.staffBookingSubject(customerName, staffEquipment),
      staff.html,
      staff.text
    )

    return sent
  } catch (error) {
    console.error('[email] Failed to send rental confirmation', error)
    return false
  }
}

function lessonDetails(input: LessonEmailInput, locale: AppLocale, recipient?: LessonRecipient): Detail[] {
  const text = copy[locale]
  const site = labels(locale)
  const names = input.recipients
    .map((person) => `${person.firstName} ${person.lastName}`.trim())
    .filter(Boolean)
  const details: Detail[] = []

  if (recipient) {
    details.push({ label: text.fullName, value: `${recipient.firstName} ${recipient.lastName}`.trim() })
    if (recipient.phoneNumber) details.push({ label: site.phone, value: recipient.phoneNumber })
    details.push({ label: site.email, value: recipient.email })
  }

  details.push(
    { label: text.reference, value: input.bookingId },
    { label: site.lessonType, value: site.lessonTypeValue(input.lessonType) },
    { label: site.people, value: peopleLabel(locale, input.numberOfPeople) },
    { label: site.duration, value: durationLabel(locale, input.duration) },
    { label: site.level, value: site.levelValue(input.level) }
  )

  if (input.teacherName) details.push({ label: site.teacher, value: input.teacherName })

  details.push(
    { label: site.date, value: formatDate(input.date, locale) },
    { label: site.startTime, value: input.startTime },
    { label: site.language, value: site.languageValue(input.language) },
    { label: site.price, value: formatMoney(input.totalPrice, locale) },
    { label: site.statusLabel, value: site.status(input.status) }
  )

  if (names.length > 1) {
    details.push({ label: site.participant, value: names.join(', ') })
  }

  return details
}

export async function sendLessonBookingEmail(input: LessonEmailInput) {
  try {
    if (input.status === 'CANCELLED') return false
    const locale = normalizeLocale(input.locale)
    const text = copy[locale]
    const unique = new Map<string, LessonRecipient>()
    for (const recipient of input.recipients) {
      const email = recipient.email?.trim()
      if (!email) continue
      const key = email.toLowerCase()
      if (!unique.has(key)) unique.set(key, { ...recipient, email })
    }
    if (unique.size === 0) return false

    let allSent = true
    for (const recipient of unique.values()) {
      const name = `${recipient.firstName} ${recipient.lastName}`.trim()
      const message = renderEmail({
        locale,
        preheader: text.lessonIntro,
        title: name ? text.greeting(name) : text.hello,
        intro: text.lessonIntro,
        details: lessonDetails(input, locale, recipient),
        note: statusNote(locale, input.status),
      })
      const sent = await deliver(recipient.email, text.lessonSubject, message.html, message.text)
      if (!sent) allSent = false
    }

    const staffNames = input.recipients
      .map((person) => {
        const name = `${person.firstName} ${person.lastName}`.trim()
        return [name, person.email, person.phoneNumber].filter(Boolean).join(' — ')
      })
      .filter(Boolean)
    const staffDetails = lessonDetails(input, 'ka')
    if (staffNames.length > 0) {
      staffDetails.push({ label: copy.ka.fullName, value: staffNames.join('; ') })
    }
    const primary = input.recipients[0]
    const staff = renderEmail({
      locale: 'ka',
      preheader: copy.ka.staffIntro,
      title: copy.ka.staffIntro,
      intro: copy.ka.staffIntro,
      details: staffDetails,
      note: null,
    })
    await notifyShop(
      primary?.email || '',
      copy.ka.staffLessonSubject(`${primary?.firstName || ''} ${primary?.lastName || ''}`.trim()),
      staff.html,
      staff.text
    )

    return allSent
  } catch (error) {
    console.error('[email] Failed to send lesson confirmation', error)
    return false
  }
}
