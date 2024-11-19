import { CategoriaKeys } from '../../components/lib/interfaces'
import categorias from '../../components/lib/categorias.json'

export const mapTransactionToCategory = (description: string): { category: CategoriaKeys; subcategory: string } => {
  const categoriaKeys = Object.keys(categorias) as CategoriaKeys[]
  for (const category of categoriaKeys) {
    const subcategories = categorias[category] as string[]
    for (const subcategory of subcategories) {
      if (description.toLowerCase().includes(subcategory.toLowerCase())) {
        return { category, subcategory }
      }
    }
  }
  // Default to 'Não contábil' if no match found
  return { 
    category: 'Outros gastos', 
    subcategory: categorias['Outros gastos'][0] 
  }
}

export const findMatchingCategory = (
  description: string,
  categoryMapping: {[key: string]: { categoria: CategoriaKeys; subcategoria: string; count: number }},
  recentTransactions: Array<{ descricao: string; categoria: CategoriaKeys | null; subcategoria: string | null }>
): { category: CategoriaKeys; subcategory: string } => {
  if (recentTransactions.length === 0) {
    console.warn("No transactions available for matching categories. Using default.");
    return { category: 'Não contábil', subcategory: categorias['Não contábil'][0] };
  }

  const normalizedDesc = description.toLowerCase().trim()

  // Exact match in category mapping
  if (categoryMapping[normalizedDesc]) {
    return {
      category: categoryMapping[normalizedDesc].categoria,
      subcategory: categoryMapping[normalizedDesc].subcategoria
    }
  }

  // Check against mapped transactions for matches
  for (const transaction of recentTransactions) {
    const transactionDesc = transaction.descricao.toLowerCase();
    if (transactionDesc.includes(normalizedDesc) || normalizedDesc.includes(transactionDesc)) {
      return {
        category: transaction.categoria!,
        subcategory: transaction.subcategoria!
      }
    }
  }

  // Find best match with highest count
  let bestMatch: { category: CategoriaKeys; subcategory: string; count: number } | null = null

  for (const [key, value] of Object.entries(categoryMapping)) {
    // Partial match with higher priority for longer matches
    if (normalizedDesc.includes(key) || key.includes(normalizedDesc)) {
      if (!bestMatch || value.count > bestMatch.count) {
        bestMatch = {
          category: value.categoria,
          subcategory: value.subcategoria,
          count: value.count
        }
      }
    }
  }

  // If best match found, return it
  if (bestMatch) {
    return {
      category: bestMatch.category,
      subcategory: bestMatch.subcategory
    }
  }

  // Fallback to default category mapping
  return mapTransactionToCategory(description)
}

export const getInitialCategoryMapping = () => {
  const initialMapping: {[key: string]: { categoria: CategoriaKeys; subcategoria: string; count: number }} = {}
  
  Object.entries(categorias).forEach(([category, subcategories]) => {
    (subcategories as string[]).forEach((subcategory: string) => {
      const normalizedSubcategory = subcategory.toLowerCase().trim()
      initialMapping[normalizedSubcategory] = {
        categoria: category as CategoriaKeys,
        subcategoria: subcategory,
        count: 1
      }
    })
  })

  return initialMapping
}
