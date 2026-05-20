declare global {
  interface Window {
    MercadoPago: new (
      publicKey: string,
      options?: { locale?: string }
    ) => {
      createCardToken: (data: {
        cardNumber: string
        cardholderName: string
        cardExpirationMonth: string
        cardExpirationYear: string
        securityCode: string
        identificationType: string
        identificationNumber: string
      }) => Promise<{
        id?: string
        error?: string
        cause?: Array<{ code: string; description: string }>
      }>
      getPaymentMethods: (params: {
        bin: string
      }) => Promise<{
        results: Array<{
          id: string
          name: string
          thumbnail: string
        }>
      }>
    }
  }
}

export {}
