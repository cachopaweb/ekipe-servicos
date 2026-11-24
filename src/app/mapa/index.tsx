"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import L, { Icon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { Input } from "../../components/ui/input";
import CidadeRepository from "@/app/repositories/cidade_repository";
import { useAppData } from "@/app/contexts/app_context";
import ClientRepository from "@/app/repositories/cliente_repository";
import { ClienteModel } from "@/app/models/cliente_model";
import { Button } from "../../components/ui/button";
import { FornecedorModel, isFornecedorAtivo } from "@/app/models/fornecedor_model";
import FornecedorRepository from "@/app/repositories/fornecedor_repository";
import { toastMixin } from "../functions/utils";

interface propsMapa {
  clienteCodigo?: number;
}

const CENTRO_PADRAO: [number, number] = [-23.5505, -46.6333];

export function Mapa({ clienteCodigo }: propsMapa) {
  const [carregando, setCarregando] = useState(true);
  const [centro, setCentro] = useState<[number, number]>(CENTRO_PADRAO); // Posição inicial do mapa
  const [cliente, setCliente] = useState<ClienteModel | null>(null);
  const [fornecedores, setFornecedores] = useState<FornecedorModel[]>([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const { OrdemCtx } = useAppData();
  const codigoClienteAlvo =
    clienteCodigo && clienteCodigo > 0 ? clienteCodigo : OrdemCtx?.ORD_CLI;

  const legalIcon = useMemo(
    () =>
      new Icon({
        iconUrl: "https://i.imgur.com/0COHo3Y.png",
        iconSize: [35, 35],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
      }),
    []
  );

  const ClientIcon = useMemo(
    () =>
      new Icon({
        iconUrl: "https://i.imgur.com/ObAibwc.png",
        iconSize: [35, 35],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
      }),
    []
  );

  useEffect(() => {
    let ativo = true;
    async function fetchData() {
      setCarregando(true);
      await Promise.all([
        carregaLatitudelongitude().catch((error) => {
          console.error("Erro ao carregar localização do cliente:", error);
        }),
        carregaFornecedores().catch((error) => {
          console.error("Erro ao carregar fornecedores:", error);
        }),
      ]);
      if (ativo) {
        setCarregando(false);
      }
    }
    fetchData();
    return () => {
      ativo = false;
    };
  }, [codigoClienteAlvo]);

  async function carregaFornecedores() {
    const repository = new FornecedorRepository();
    const listaFornecedores = await repository.getAllFornecedores();
    const fornecedoresAtivos = listaFornecedores.filter((fornecedor) =>
      isFornecedorAtivo(fornecedor.ESTADO)
    );
    const invalidos = fornecedoresAtivos.filter(
      (fornecedor) =>
        fornecedor.LATITUDE &&
        fornecedor.LONGITUDE &&
        !isConvertibleToNumber(fornecedor.LATITUDE, fornecedor.LONGITUDE)
    );
    if (invalidos.length > 0) {
      toastMixin.fire({
        icon: 'warning',
        title: 'Atenção',
        text: `${invalidos.length} fornecedor(es) possuem coordenadas inválidas e não serão exibidos no mapa.`,
      });
    }
    setFornecedores(fornecedoresAtivos);
  }

  async function carregaLatitudelongitude() {
    if (!codigoClienteAlvo || isNaN(codigoClienteAlvo) || codigoClienteAlvo <= 0) {
      setCliente(null);
      setLatitude("");
      setLongitude("");
      setCentro(CENTRO_PADRAO);
      return;
    }

    const repository = new ClientRepository();
    const cidadeRepository = new CidadeRepository();
    const clienteRaw = await repository.getClienteById(codigoClienteAlvo);
    const clienteAux: ClienteModel | null = Array.isArray(clienteRaw)
      ? (clienteRaw[0] ?? null)
      : (clienteRaw ?? null);

    if (!clienteAux || !clienteAux.CODIGO) {
      setCliente(null);
      return;
    }

    if (!isConvertibleToNumber(clienteAux.LATITUDE, clienteAux.LONGITUDE)) {
      const latLog: [number, number] = await cidadeRepository.getLatitudeLongitude({
        endereco: clienteAux.ENDERECO ?? "",
        bairro: clienteAux.BAIRRO ?? "",
        cidadeEstado: clienteAux.CIDADE ?? "",
      });
      const latStr = String(latLog[0]);
      const lonStr = String(latLog[1]);
      repository.addLatLong({ ...clienteAux, LATITUDE: latStr, LONGITUDE: lonStr });
      setCliente({ ...clienteAux, LATITUDE: latStr, LONGITUDE: lonStr });
      setCentro(latLog);
      setLatitude(latStr);
      setLongitude(lonStr);
    } else {
      setCliente(clienteAux);
      setCentro([Number(clienteAux.LATITUDE), Number(clienteAux.LONGITUDE)]);
      setLatitude((clienteAux.LATITUDE ?? "").trim());
      setLongitude((clienteAux.LONGITUDE ?? "").trim());
    }
  }

  function isConvertibleToNumber(str1?: string | null, str2?: string | null): boolean {
    const s1 = (str1 ?? "").trim();
    const s2 = (str2 ?? "").trim();
    return s1 !== "" && s2 !== "" && Number.isFinite(Number(s1)) && Number.isFinite(Number(s2));
  }

  function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em quilômetros
    const rad = Math.PI / 180;

    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em quilômetros
  }

  function atualizaLocalizacao() {
    setCarregando(true);
    const repository = new ClientRepository();
    if (cliente?.CODIGO !== undefined) {
      repository.addLatLong({ ...cliente, LATITUDE: latitude, LONGITUDE: longitude });
      setCliente({ ...cliente, LATITUDE: latitude, LONGITUDE: longitude });
    } else {
      console.error("Cliente CODIGO is undefined. Cannot update cliente.");
    }
    setCentro([Number(latitude), Number(longitude)]);
    setCarregando(false);
  }

  function MarcacaoCliente({ initialPosition }: { initialPosition: [number, number] }) {
    const [draggable, setDraggable] = useState(false);
    const [position, setPosition] = useState<[number, number]>(initialPosition);
    const markerRef = useRef<L.Marker>(null);

    useEffect(() => {
      setPosition(initialPosition);
    }, [initialPosition]);

    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            setPosition([marker.getLatLng().lat, marker.getLatLng().lng]);
          }
        },
      }),
      []
    );
    const toggleDraggable = useCallback(() => {
      setDraggable((d) => !d);
    }, []);

    if (!isConvertibleToNumber(latitude || cliente?.LATITUDE, longitude || cliente?.LONGITUDE)) {
      return null;
    }

    return (
      <div>
        {carregando ? (
          <>carregando</>
        ) : (
          <Marker
            icon={ClientIcon}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
          >
            <Popup minWidth={90}>
              <span onClick={toggleDraggable}>
                {cliente?.NOME ?? ""} <br />
              </span>
            </Popup>
          </Marker>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 p-1">
      <div className="ek-card p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <Input
              type="text"
              value={latitude}
              className="uppercase"
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="latitude"
            />
            <Input
              type="text"
              value={longitude}
              className="uppercase"
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="longitude"
            />
            <Button onClick={atualizaLocalizacao}>Atualizar</Button>
          </div>
          <div>
            {carregando ? (
              <>Carregando...</>
            ) : (
              <MapContainer center={centro} zoom={13} scrollWheelZoom={true} className="map-container">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MarcacaoCliente initialPosition={centro} />
                {fornecedores.map((fornecedor) => {
                  if (
                    !fornecedor.LATITUDE ||
                    !fornecedor.LONGITUDE ||
                    !isConvertibleToNumber(fornecedor.LATITUDE, fornecedor.LONGITUDE)
                  ) {
                    return null;
                  }
                  const nomeExibicao =
                    fornecedor.NOME?.trim() ||
                    fornecedor.RAZAOSOCIAL?.trim() ||
                    `Fornecedor #${fornecedor.CODIGO}`;
                  const latCliente = latitude || cliente?.LATITUDE;
                  const lonCliente = longitude || cliente?.LONGITUDE;
                  const temLocalizacaoCliente = isConvertibleToNumber(latCliente, lonCliente);

                  return (
                    <Marker
                      key={fornecedor.CODIGO}
                      position={[Number(fornecedor.LATITUDE), Number(fornecedor.LONGITUDE)]}
                      icon={legalIcon}
                    >
                      <Popup>
                        {nomeExibicao} <br />
                        {temLocalizacaoCliente
                          ? `Fica a ${calcularDistancia(
                              Number(latCliente),
                              Number(lonCliente),
                              Number(fornecedor.LATITUDE),
                              Number(fornecedor.LONGITUDE)
                            ).toFixed(2)} km de distância`
                          : "Localização do cliente não definida"}
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
  );
}
