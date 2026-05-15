/**
 * Serviço para lidar com consulta de CEP usando ViaCEP
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const cepService = {
  cleanCep(cep: string): string {
    return cep.replace(/\D/g, '');
  },

  formatCep(cep: string): string {
    const cleaned = this.cleanCep(cep);
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  },

  isValidCep(cep: string): boolean {
    const cleaned = this.cleanCep(cep);
    return cleaned.length === 8;
  },

  async fetchAddressByCep(cep: string): Promise<AddressData | null> {
    const cleaned = this.cleanCep(cep);
    if (cleaned.length !== 8) return null;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return {
        cep: data.cep,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf
      };
    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      throw error;
    }
  }
};
