# Corte de la puerta

La puerta de GoliathOmics es esta aplicación, sobre la base `goliath`.

1. Aplica el esquema de GoliathApp y después `GoliathOmics/scripts/apply_domain_schema.sh`.
2. Publica al menos un `cfg.study` y una versión activa de `SamplePrepPipeline`.
3. Apunta `GOLIATH_DATABASE_URL` a esa base.
4. Los operadores entran aquí. Encolar SamplePrep no arranca la instancia: drena con `methyl-study-start drain-requests`.
5. El host uniGUI de EPORTAL deja de ser la interfaz. El repositorio Delphi queda como referencia del comportamiento anterior. Los workers no se mueven con este corte.
