// API utility functions for CheckBill backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    }

    return await response.text()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(`Network error: ${error.message}`, 0)
  }
}

// Bill API functions
export const billApi = {
  async createBill(billData) {
    return apiRequest("/bills", {
      method: "POST",
      body: JSON.stringify(billData),
    })
  },

  async getBill(slug) {
    return apiRequest(`/bills/${slug}`)
  },

  async getBillSummary(slug) {
    return apiRequest(`/bills/${slug}/summary`)
  },

  async updateBill(slug, billData) {
    return apiRequest(`/bills/${slug}`, {
      method: "PUT",
      body: JSON.stringify(billData),
    })
  },

  async closeBill(slug) {
    return apiRequest(`/bills/${slug}/close`, {
      method: "PATCH",
    })
  },

  async getItemQR(slug, itemId) {
    return apiRequest(`/bills/${slug}/items/${itemId}/qr`)
  },
}

// Payment API functions
export const paymentApi = {
  async createPayment(paymentData) {
    return apiRequest("/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    })
  },

  async getPaymentByItem(itemId) {
    return apiRequest(`/payments/item/${itemId}`)
  },
}

// Utility function to handle file upload (real implementation)
export async function uploadSlip(file) {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new ApiError(`Upload failed! status: ${response.status}`, response.status)
    }

    const data = await response.json()

    if (!data.url) {
      throw new ApiError("Upload response missing URL", response.status)
    }

    return data.url
  } catch (error) {
    throw new ApiError(`Upload error: ${error.message}`, 0)
  }
}

export { ApiError }
