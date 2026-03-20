import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import RecipeImageUpload from '../RecipeImageUpload'
import api from '../../../services/api'

// Mock the api service so we can track calls and control responses
vi.mock('../../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Helper: create a fake File object
const createFile = (name, size, type) => {
  const content = new Array(size).fill('a').join('')
  return new File([content], name, { type })
}

// Helper: render the component with optional props
const renderComponent = (props = {}) => render(<RecipeImageUpload {...props} />)

describe('RecipeImageUpload', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // ─── Initial render ──────────────────────────────────────────────────────

  describe('Initial render', () => {
    it('renders the title and subtitle', () => {
      renderComponent()
      expect(screen.getByText('imageUpload.title')).toBeInTheDocument()
      expect(screen.getByText('imageUpload.subtitle')).toBeInTheDocument()
    })

    it('renders the drop zone with helper text', () => {
      renderComponent()
      expect(screen.getByText('imageUpload.dragDropText')).toBeInTheDocument()
      expect(screen.getByText('imageUpload.browseFiles')).toBeInTheDocument()
      expect(screen.getByText('imageUpload.supportedFormats')).toBeInTheDocument()
      expect(screen.getByText('imageUpload.maxSize')).toBeInTheDocument()
    })

    it('does not show the upload button initially', () => {
      renderComponent()
      expect(screen.queryByText('imageUpload.uploadButton')).not.toBeInTheDocument()
    })

    it('has an accessible file input', () => {
      renderComponent()
      const input = document.getElementById('ocr-file-upload')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'file')
      expect(input).toHaveAttribute('accept')
    })
  })

  // ─── File validation ─────────────────────────────────────────────────────

  describe('File validation', () => {
    it('accepts a valid JPEG file', async () => {
      renderComponent()
      const file = createFile('photo.jpg', 1024, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText('photo.jpg')).toBeInTheDocument()
    })

    it('accepts a valid PNG file', async () => {
      renderComponent()
      const file = createFile('photo.png', 2048, 'image/png')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText('photo.png')).toBeInTheDocument()
    })

    it('accepts a valid PDF file', async () => {
      renderComponent()
      const file = createFile('recipe.pdf', 4096, 'application/pdf')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText('recipe.pdf')).toBeInTheDocument()
    })

    it('rejects a file with an unsupported type', async () => {
      renderComponent()
      const file = createFile('video.mp4', 1024, 'video/mp4')
      const input = document.getElementById('ocr-file-upload')
      // Use fireEvent.change to bypass the `accept` attribute enforcement in userEvent
      fireEvent.change(input, { target: { files: [file] } })
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('imageUpload.errors.invalidType')).toBeInTheDocument()
    })

    it('rejects a file exceeding 10 MB', async () => {
      renderComponent()
      const tenMBPlusOne = 10 * 1024 * 1024 + 1
      const file = createFile('big.png', tenMBPlusOne, 'image/png')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('imageUpload.errors.tooLarge')).toBeInTheDocument()
    })

    it('calls onError callback when file is invalid', async () => {
      const onError = vi.fn()
      renderComponent({ onError })
      const file = createFile('doc.docx', 500, 'application/msword')
      const input = document.getElementById('ocr-file-upload')
      // Use fireEvent.change to bypass accept attribute enforcement in userEvent
      fireEvent.change(input, { target: { files: [file] } })
      expect(onError).toHaveBeenCalledWith('imageUpload.errors.invalidType')
    })
  })

  // ─── File selection UI ───────────────────────────────────────────────────

  describe('File selection UI', () => {
    it('shows the selected file name after choosing a valid file', async () => {
      renderComponent()
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      expect(screen.getByText('recipe.jpg')).toBeInTheDocument()
    })

    it('shows the upload button after a valid file is selected', async () => {
      renderComponent()
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      expect(screen.getByText('imageUpload.uploadButton')).toBeInTheDocument()
    })

    it('shows a remove button after a valid file is selected', async () => {
      renderComponent()
      const file = createFile('recipe.png', 1024, 'image/png')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      expect(screen.getByLabelText('imageUpload.removeFile')).toBeInTheDocument()
    })

    it('removes the file and resets state when remove button is clicked', async () => {
      renderComponent()
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)

      const removeBtn = screen.getByLabelText('imageUpload.removeFile')
      await userEvent.click(removeBtn)

      expect(screen.queryByText('recipe.jpg')).not.toBeInTheDocument()
      expect(screen.queryByText('imageUpload.uploadButton')).not.toBeInTheDocument()
    })

    it('shows PDF icon placeholder for PDF files instead of image preview', async () => {
      renderComponent()
      const file = createFile('recipe.pdf', 2048, 'application/pdf')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      // The img preview should NOT be present for PDFs
      expect(screen.queryByAltText('imageUpload.preview')).not.toBeInTheDocument()
      // File name should still be visible
      expect(screen.getByText('recipe.pdf')).toBeInTheDocument()
    })
  })

  // ─── Drag and drop ────────────────────────────────────────────────────────

  describe('Drag and drop', () => {
    it('adds drag-over styling on dragover', () => {
      renderComponent()
      const dropZone = screen.getByRole('button', { name: 'imageUpload.dragDropText' })
      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
      // The class includes the hover variant when isDragOver is true
      expect(dropZone.className).toMatch(/border-papaya/)
    })

    it('removes drag-over styling on dragleave', () => {
      renderComponent()
      const dropZone = screen.getByRole('button', { name: 'imageUpload.dragDropText' })
      fireEvent.dragOver(dropZone)
      fireEvent.dragLeave(dropZone)
      expect(dropZone.className).not.toMatch(/bg-sunglow/)
    })

    it('accepts a dropped valid file', async () => {
      renderComponent()
      const file = createFile('dropped.png', 1024, 'image/png')
      const dropZone = screen.getByRole('button', { name: 'imageUpload.dragDropText' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      await waitFor(() => {
        expect(screen.getByText('dropped.png')).toBeInTheDocument()
      })
    })

    it('rejects a dropped invalid file type', async () => {
      renderComponent()
      const file = createFile('video.mp4', 512, 'video/mp4')
      const dropZone = screen.getByRole('button', { name: 'imageUpload.dragDropText' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('does nothing on drop when disabled', async () => {
      renderComponent({ disabled: true })
      const file = createFile('photo.jpg', 512, 'image/jpeg')
      const dropZone = screen.getByRole('button', { name: 'imageUpload.dragDropText' })

      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

      await waitFor(() => {
        expect(screen.queryByText('photo.jpg')).not.toBeInTheDocument()
      })
    })
  })

  // ─── Upload flow ─────────────────────────────────────────────────────────

  describe('Upload flow', () => {
    it('calls api.post with multipart form data on upload', async () => {
      api.post.mockResolvedValue({
        data: {
          url: 'https://cloudinary.example.com/recipe.jpg',
          publicId: 'family-recipes/ocr/abc123',
          filename: 'recipe.jpg',
          size: 500,
          mimeType: 'image/jpeg',
          type: 'image',
          ocrData: null,
        },
      })

      renderComponent()
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)

      await userEvent.click(screen.getByText('imageUpload.uploadButton'))

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/recipes/ocr',
          expect.any(FormData),
          expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }) }),
        )
      })
    })

    it('shows success state after a successful upload', async () => {
      api.post.mockResolvedValue({
        data: {
          url: 'https://cloudinary.example.com/recipe.jpg',
          publicId: 'abc',
          filename: 'recipe.jpg',
          size: 500,
          mimeType: 'image/jpeg',
          type: 'image',
          ocrData: null,
        },
      })

      renderComponent()
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      await userEvent.click(screen.getByText('imageUpload.uploadButton'))

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('imageUpload.uploadSuccess')).toBeInTheDocument()
      })
    })

    it('calls onUploadComplete callback after successful upload', async () => {
      const mockResult = {
        url: 'https://cloudinary.example.com/recipe.jpg',
        publicId: 'abc',
        filename: 'recipe.jpg',
        size: 500,
        mimeType: 'image/jpeg',
        type: 'image',
        ocrData: null,
      }
      api.post.mockResolvedValue({ data: mockResult })

      const onUploadComplete = vi.fn()
      renderComponent({ onUploadComplete })
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      await userEvent.click(screen.getByText('imageUpload.uploadButton'))

      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalledWith(mockResult)
      })
    })

    it('shows an error message when the upload fails', async () => {
      api.post.mockRejectedValue({
        response: { data: { error: 'Failed to upload file' } },
      })

      renderComponent()
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      await userEvent.click(screen.getByText('imageUpload.uploadButton'))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Failed to upload file')).toBeInTheDocument()
      })
    })

    it('calls onError callback when upload fails', async () => {
      api.post.mockRejectedValue({
        response: { data: { error: 'Server error' } },
      })

      const onError = vi.fn()
      renderComponent({ onError })
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      await userEvent.click(screen.getByText('imageUpload.uploadButton'))

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Server error')
      })
    })

    it('falls back to generic error message when server provides none', async () => {
      api.post.mockRejectedValue(new Error('Network error'))

      renderComponent()
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      await userEvent.click(screen.getByText('imageUpload.uploadButton'))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('imageUpload.errors.uploadFailed')).toBeInTheDocument()
      })
    })

    it('shows "upload another" button after success and resets when clicked', async () => {
      api.post.mockResolvedValue({
        data: {
          url: 'https://cloudinary.example.com/recipe.jpg',
          publicId: 'abc',
          filename: 'recipe.jpg',
          size: 500,
          mimeType: 'image/jpeg',
          type: 'image',
          ocrData: null,
        },
      })

      renderComponent()
      const file = createFile('recipe.jpg', 500, 'image/jpeg')
      const input = document.getElementById('ocr-file-upload')
      await userEvent.upload(input, file)
      await userEvent.click(screen.getByText('imageUpload.uploadButton'))

      await waitFor(() => {
        expect(screen.getByText('imageUpload.uploadAnother')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('imageUpload.uploadAnother'))

      // Should reset to idle state with drop zone visible
      expect(screen.getByText('imageUpload.dragDropText')).toBeInTheDocument()
      expect(screen.queryByText('imageUpload.uploadSuccess')).not.toBeInTheDocument()
    })
  })

  // ─── Disabled state ────────────────────────────────────────────────────────

  describe('Disabled state', () => {
    it('applies disabled attribute to the file input when disabled', () => {
      renderComponent({ disabled: true })
      const input = document.getElementById('ocr-file-upload')
      expect(input).toBeDisabled()
    })

    it('sets aria-disabled on the drop zone when disabled', () => {
      renderComponent({ disabled: true })
      const dropZone = screen.getByRole('button', { name: 'imageUpload.dragDropText' })
      expect(dropZone).toHaveAttribute('aria-disabled', 'true')
    })
  })

  // ─── Accessibility ─────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('has an accessible region landmark with label', () => {
      renderComponent()
      expect(screen.getByRole('region', { name: 'imageUpload.title' })).toBeInTheDocument()
    })

    it('has a keyboard-activatable drop zone', async () => {
      renderComponent()
      const dropZone = screen.getByRole('button', { name: 'imageUpload.dragDropText' })
      expect(dropZone).toHaveAttribute('tabIndex', '0')
    })
  })
})
