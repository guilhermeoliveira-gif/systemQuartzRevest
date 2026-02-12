-- Inserir Clientes de Teste
INSERT INTO vendas_cliente (nome, cnpj_cpf, contato, endereco, email, telefone)
VALUES 
('Construtora Horizonte', '12.345.678/0001-90', 'Carlos Engenheiro', 'Av. das Nações, 1000 - SP', 'compras@horizonte.com.br', '(11) 99999-1000'),
('Home Center Construir', '98.765.432/0001-10', 'Mariana Gerente', 'Rua do Comércio, 500 - RJ', 'loja@construir.com.br', '(21) 98888-2000'),
('Reforma Fácil Ltda', '45.678.901/0001-20', 'Pedro Empreiteiro', 'Rua das Obras, 123 - MG', 'pedro@reformafacil.com.br', '(31) 97777-3000'),
('Cliente Balcão', '000.000.000-00', 'Venda Direta', 'Loja Física', 'balcao@quartz.com.br', '(00) 0000-0000');

-- Inserir Produtos Acabados de Teste (Compatível com esquema real)
INSERT INTO produto_acabado (nome, unidade_medida, estoque_atual, estoque_minimo)
VALUES
('Argamassa ACIII Branca 20kg', 'SC', 1500, 100),
('Argamassa ACII Cinza 20kg', 'SC', 2000, 150),
('Rejunte Epóxi Branco 1kg', 'KG', 500, 50),
('Rejunte Acrílico Bege 1kg', 'KG', 300, 30),
('Impermeabilizante Flex 18kg', 'LT', 100, 10)
ON CONFLICT (nome) DO NOTHING; -- Omiti id para deixar o banco gerar
