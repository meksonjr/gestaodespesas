import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface Despesa {
  descricao: string;
  quantidade: number;
  valor: number;
  valorConvertido: number;
  moedaOrigem: string;
  moedaDestino: string;
}


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public Descricao: string = '';
  public Quantidade: number | undefined;
  public Valor: number | undefined;

  public moedas: string[] = [];
  public moedaOrigem: string = '';
  public moedaDestino: string = '';
  public resultadoConversao: number | undefined;

  public despesas: Despesa[] = [];
  public despesaEditandoIndex: number | null = null;

  private apiKey: string = 'eaf5c3a6f3625d654507a11d';

  constructor(
    private http: HttpClient,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.carregarMoedas();
  }

  carregarMoedas() {
    this.http
      .get<any>(`https://v6.exchangerate-api.com/v6/${this.apiKey}/codes`)
      .subscribe((response) => {
        this.moedas = response.supported_codes.map((code: any) => code[0]);
      });
  }

  async adicionarNovaDespesa() {
    if (!this.Descricao || this.Quantidade == null || this.Valor == null || !this.moedaOrigem || !this.moedaDestino) {
      await this.presentAlert('Campos obrigatórios', 'Preencha todos os campos antes de adicionar a despesa.');
      return;
    }

    const valorConvertido = await this.converterMoeda(this.Valor!, this.moedaOrigem, this.moedaDestino);

    if (valorConvertido !== null) {
      if (this.despesaEditandoIndex !== null) {
        this.atualizarDespesa(this.despesaEditandoIndex, valorConvertido);
      } else {
        this.criarNovaDespesa(valorConvertido);
      }
      this.limparInputs();
    }
  }

  criarNovaDespesa(valorConvertido: number) {
    const novaDespesa: Despesa = {
      descricao: this.Descricao,
      quantidade: this.Quantidade!,
      valor: this.Valor!,
      valorConvertido: valorConvertido,
      moedaOrigem: this.moedaOrigem,
      moedaDestino: this.moedaDestino,
    };
    this.despesas.push(novaDespesa);
  }

  atualizarDespesa(index: number, valorConvertido: number) {
    const despesaAtualizada: Despesa = {
      descricao: this.Descricao,
      quantidade: this.Quantidade!,
      valor: this.Valor!,
      valorConvertido: valorConvertido,
      moedaOrigem: this.moedaOrigem,
      moedaDestino: this.moedaDestino,
    };

    this.despesas[index] = despesaAtualizada;
    this.despesaEditandoIndex = null;
  }

  async converterMoeda(valor: number, origem: string, destino: string): Promise<number | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`https://v6.exchangerate-api.com/v6/${this.apiKey}/pair/${origem}/${destino}/${valor}`)
      );
      return response?.conversion_result ?? null;
    } catch (error) {
      console.error('Erro ao converter moedas:', error);
      return null;
    }
  }

  editarDespesa(index: number) {
    const despesa = this.despesas[index];
    this.Descricao = despesa.descricao;
    this.Quantidade = despesa.quantidade;
    this.Valor = despesa.valor;
    this.moedaOrigem = despesa.moedaOrigem;
    this.moedaDestino = despesa.moedaDestino;
    this.despesaEditandoIndex = index;
  }

  async confirmarExclusao(index: number) {
    const alert = await this.alertController.create({
      header: 'Confirmação',
      message: 'Tem certeza de que deseja excluir esta despesa?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Exclusão cancelada');
          }
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.excluirDespesa(index);
          }
        }
      ]
    });

    await alert.present();
  }

  excluirDespesa(index: number) {
    this.despesas.splice(index, 1);
    console.log('Despesa excluída');
  }

  getTotalMoedaOrigem() {
    return this.despesas.reduce((total, despesa) => total + (despesa.valor * despesa.quantidade), 0);
  }

  getTotalMoedaDestino() {
    return this.despesas.reduce((total, despesa) => total + (despesa.valorConvertido * despesa.quantidade), 0);
  }

  limparInputs() {
    this.Descricao = '';
    this.Quantidade = 0;
    this.Valor = undefined;
    this.moedaOrigem = '';
    this.moedaDestino = '';
    this.despesaEditandoIndex = null;
  }

  async presentAlert(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
