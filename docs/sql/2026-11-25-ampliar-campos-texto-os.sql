-- Ampliação de colunas de texto para evitar erro 500 (string truncation) em OS e Empreitadas
-- Banco: Firebird (WIN1252)
-- Seguro para executar com dados existentes (apenas amplia VARCHAR, sem perda de dados).

ALTER TABLE ORD_SER ALTER COLUMN OS_NOME TYPE VARCHAR(4000);
ALTER TABLE ORDENS ALTER COLUMN ORD_SOLICITACAO TYPE VARCHAR(500);
ALTER TABLE EMPREITADAS ALTER COLUMN EMP_OBS TYPE VARCHAR(2000);
COMMIT;
