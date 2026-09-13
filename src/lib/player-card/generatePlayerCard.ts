import {
  PDFDocument,
  StandardFonts,
  rgb,
} from 'pdf-lib'

type PlayerCardData = {
  fullName: string
  playerNumber: string
  gender?: string | null
  dateOfBirth?: string | null
  phone?: string | null
  membershipType?: string | null
  membershipStartDate?: string | null
  photoBytes?: Uint8Array | null
  photoContentType?: string | null
}

export async function generatePlayerCard(
  player: PlayerCardData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  const page = pdfDoc.addPage([540, 340])

  const width = page.getWidth()
  const height = page.getHeight()

  const regularFont = await pdfDoc.embedFont(
    StandardFonts.Helvetica
  )

  const boldFont = await pdfDoc.embedFont(
    StandardFonts.HelveticaBold
  )

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.96, 0.96, 0.96),
  })

  // Header
  page.drawRectangle({
    x: 0,
    y: height - 75,
    width,
    height: 75,
    color: rgb(0, 0, 0),
  })

  page.drawText('BDLTA', {
    x: 30,
    y: height - 35,
    size: 24,
    font: boldFont,
    color: rgb(1, 1, 1),
  })

  page.drawText('DIGITAL PLAYER CARD', {
    x: 30,
    y: height - 58,
    size: 11,
    font: regularFont,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Player ID
  page.drawText('PLAYER ID', {
    x: 30,
    y: height - 105,
    size: 9,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  })

  page.drawText(player.playerNumber, {
    x: 30,
    y: height - 128,
    size: 22,
    font: boldFont,
    color: rgb(0, 0, 0),
  })

  // Photo
  if (player.photoBytes && player.photoContentType) {
    try {
      let image

      if (player.photoContentType === 'image/png') {
        image = await pdfDoc.embedPng(player.photoBytes)
      } else {
        image = await pdfDoc.embedJpg(player.photoBytes)
      }

      page.drawImage(image, {
        x: width - 145,
        y: height - 235,
        width: 110,
        height: 135,
      })
    } catch (error) {
      console.error('Unable to embed player photo:', error)
    }
  }

  // Player details
  const detailsX = 30
  let currentY = height - 165

  const drawDetail = (
    label: string,
    value: string
  ) => {
    page.drawText(label, {
      x: detailsX,
      y: currentY,
      size: 9,
      font: boldFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    page.drawText(value || '-', {
      x: detailsX,
      y: currentY - 16,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    })

    currentY -= 45
  }

  drawDetail('FULL NAME', player.fullName)

  drawDetail(
    'DATE OF BIRTH',
    player.dateOfBirth
      ? new Date(player.dateOfBirth).toLocaleDateString('en-IN')
      : '-'
  )

  drawDetail(
    'GENDER',
    player.gender
      ? player.gender.charAt(0).toUpperCase() +
          player.gender.slice(1)
      : '-'
  )

  drawDetail(
    'MEMBERSHIP',
    player.membershipType || 'Lifetime'
  )

  // Footer
  page.drawLine({
    start: {
      x: 30,
      y: 35,
    },
    end: {
      x: width - 30,
      y: 35,
    },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  })

  page.drawText(
    'This digital card confirms BDLTA player membership.',
    {
      x: 30,
      y: 18,
      size: 8,
      font: regularFont,
      color: rgb(0.45, 0.45, 0.45),
    }
  )

  return await pdfDoc.save()
}