import type { Site } from '@/types'

export const mockSites: Site[] = [
  {
    id: 's001',
    name: '城东洗车场 A 站',
    address: '城东区朝阳路 128 号',
    status: 'warning',
    deviceCount: 6,
    lastInspection: '2026-05-25',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=outdoor%20self%20service%20car%20wash%20station%20with%20multiple%20washing%20bays%20blue%20sky&image_size=landscape_16_9',
  },
  {
    id: 's002',
    name: '城西洗车场 B 站',
    address: '城西区建设大道 56 号',
    status: 'error',
    deviceCount: 4,
    lastInspection: '2026-05-24',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20self%20car%20wash%20facility%20at%20sunset%20industrial%20style&image_size=landscape_16_9',
  },
  {
    id: 's003',
    name: '城南洗车场 C 站',
    address: '城南区科技路 200 号',
    status: 'normal',
    deviceCount: 8,
    lastInspection: '2026-05-26',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20automated%20car%20wash%20station%20with%20green%20plants%20around&image_size=landscape_16_9',
  },
  {
    id: 's004',
    name: '城北洗车场 D 站',
    address: '城北区工业园 88 号',
    status: 'normal',
    deviceCount: 5,
    lastInspection: '2026-05-26',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=compact%20self%20service%20car%20wash%20near%20gas%20station%20daytime&image_size=landscape_16_9',
  },
  {
    id: 's005',
    name: '市中心洗车场 E 站',
    address: '市中心商业广场 B1 层',
    status: 'warning',
    deviceCount: 3,
    lastInspection: '2026-05-23',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=underground%20car%20wash%20station%20in%20shopping%20mall%20parking%20lot&image_size=landscape_16_9',
  },
]
