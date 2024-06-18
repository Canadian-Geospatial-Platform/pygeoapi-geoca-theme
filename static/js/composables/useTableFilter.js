import { ref, computed } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.0.7/vue.esm-browser.prod.js'

export default function useTableFilter(rows, keyColumns, defaultSortCol, tableTexti18n) {
  // sort and filtering
  const searchText = ref('')
  const searchTextLowered = computed(() => {
    return searchText.value.toLowerCase()
  })
  const currentSortDir = ref('asc')
  const currentSort = ref(defaultSortCol)
  const pageSize = ref(500)
  const currentPage = ref(1)
  const totalSize = computed(() => {
    return rows.value.length
  })

  // change sort direction
  const sortDir = function(colKey) {
    // if colKey == current sort, reverse
    if (colKey === currentSort.value) {
      currentSortDir.value = currentSortDir.value === 'asc' ? 'desc' : 'asc'
    }
    currentSort.value = colKey
  }

  // change sort icon
  const sortIconClass = computed(() => {
    if (currentSortDir.value === 'asc') {
      return 'glyphicon-sort-by-attributes'
    } else {
      return 'glyphicon-sort-by-attributes-alt'
    }
  })
  
  // sort function for rows
  const sortRows = function(a, b) {
    let modifier = 1
    if (currentSortDir.value === 'desc') {
      modifier = -1
    }
    if (a[currentSort.value] < b[currentSort.value]) {
      return -1 * modifier
    }
    if (a[currentSort.value] > b[currentSort.value]) {
      return 1 * modifier
    }
    return 0
  }

  // filter function for rows
  const searchFilter = function(row) {
    if (searchText.value !== '') {
      let rowText = ''

      // concatenate all properties to a single text for ease of search
      Object.keys(row).forEach((key) => {
        if (!keyColumns.value.includes(key)) {
          return false
        } else if (row[key] === null) {
          return false // skip null values
        } else {
          const valueText = row[key] + '' // ensure to string
          rowText += '^' + valueText.toLowerCase() + '$' // hidden starts with and ends search helper; like regex
        }
      })

      if (rowText.includes(searchTextLowered.value)) {
        return true
      } else {
        return false
      }
    } else {
      return true
    }
  }

  // pagination
  const paginateFilter = function (row, index) {
    const start = (currentPage.value - 1) * pageSize.value
    const end = currentPage.value * pageSize.value
    if (index >= start && index < end) {
      return true
    } else {
      return false
    }
  }
  const nextPage = function () {
    if ((currentPage.value * pageSize.value) < filteredNumEntries.value) {
      currentPage.value++
    }
  }
  const prevPage = function () {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }
  const filteredNumEntries = computed(() => {
    return filteredRows.value.length
  })
  const startEntryOfPage = computed(() => {
    if (filteredNumEntries.value === 0) {
      return 0
    } else if (currentPage.value === 1) {
      return currentPage.value
    } else {
      return ((currentPage.value - 1) * pageSize.value) + 1
    }
  })
  const lastEntryOfPage = computed(() => {
    const maxEntryThisPage = currentPage.value * pageSize.value
    if (maxEntryThisPage < filteredNumEntries.value) {
      return maxEntryThisPage
    } else {
      return filteredNumEntries.value
    }
  })
  // const maxPages = computed(() => {
  //   return Math.ceil(filteredNumEntries / pageSize)
  // })
  const filteredFromText = computed(() => {
    if (filteredNumEntries.value < totalSize.value) {
      if (totalSize.value === 1) {
        // singular case
        return tableTexti18n.filteredSingular.replace('$totalSize', totalSize.value)
      } else { // > 1
        // plural case
        return tableTexti18n.filteredPlural.replace('$totalSize', totalSize.value)
      }
    } else {
      return ''
    }
  })
  const showingFilteredFromText = computed(() => {
    if (filteredFromText.value !== '') {
      return filteredNumEntries.value + ' ' + filteredFromText.value
    } else {
      return ''
    }
  })
  const showingFilterText = computed(() => {
    let showText = tableTexti18n.showing
      .replace('$startEntryOfPage', startEntryOfPage.value)
      .replace('$lastEntryOfPage', lastEntryOfPage.value)
      .replace('$lastEntryOfPage', lastEntryOfPage.value)
    if (filteredFromText.value !== '') {
      showText += ` (${filteredFromText.value})`
    }
    return showText
  })

  const filteredRows = computed(() => {
    return rows.value
      .filter(searchFilter)
      .sort(sortRows)
  })
  const paginatedRows = computed(() => {
    return filteredRows.value
      .filter(paginateFilter)
  })

  // html/string modications for table presentation
  const stripTags = function(htmlString) {
    return htmlString.replace(/<[^>]+>/g, '')
  }
  const truncate = function (str, num) {
    if (str.length <= num) {
      return str
    }
    return str.slice(0, num) + '...'
  }
  const truncateStripTags = function(str) {
    return truncate(stripTags(str), 350)
  }
  const linkToRow = function(row, key, itemPath, locale) {
    if (key === 'id') {
      return `<a href="${itemPath + '/' + row[key]}?lang=${locale}">${row[key]}</a>`
    } else if (key === 'links', key === 'associations') {
      let linksList = '<ul>'
      for (let element in row[key]) {
        if (row[key][element]['href'] !== null && row[key][element]['href'] !== 'null') {
          linksList = linksList + '<li><a href="' + row[key][element]['href'] + '" target="_blank">'
            + row[key][element]['title'] + '</a></li>'
        }
      }
      linksList = linksList + '</ul>'
      return `${linksList}`
    } else if (typeof row[key] === 'object') {
      return stringifyObj(row[key])
    } else if (typeof row[key] === 'string') {
      return formatString(row[key])
    } else {
      return row[key]
    }
  }

  const stringifyObj = function(obj) {
    let objStr = ''
    if (Array.isArray(obj)) {
      for (let k = 0; k < obj.length; k++) {
        if (k < obj.length - 1) {
          objStr = objStr + stringifyObj(obj[k]) + ', '
        } else {
          objStr = objStr + stringifyObj(obj[k])
        }
      }
      return objStr
    } else if (typeof obj === 'object') {
      for (let k in obj) {
        objStr = objStr + ' <i>' + k + '</i>: ' + stringifyObj(obj[k]) + '<br>'
      }
      return objStr
    } else if (typeof obj === 'string') {
      return objStr + formatString(obj)
    } else {
      return objStr + obj
    }
  }

  const formatString = function(str) {
    str = replaceNewLine(str)
    str = replaceMarkdownLinks(str)
    str = renderLinks(str)
    str = replaceMarkdownBold(str)
    str = formatDate(str)
    str = formatMarkdownListItems(str)
    str = formatImgURL(str)
    return str
  }

  const replaceNewLine = function(str) {
    // Replace /n with <br>
    return str.replace(/\\n/g, '<br>');
  }

  const replaceMarkdownLinks = function(str) {
    // Replace markdown links with html links
    // This section is based on the following solution:
    // https://gist.github.com/alordiel/ed8587044be07e408f5f93b3124836b3
    let markdownLink = str.match(/\[.*?\]\(.*?\)/g)
    if (markdownLink != null && markdownLink.length > 0){
      for (let link of markdownLink) {
        let txt = link.match(/\[(.*?)\]/)[1]
        let url = link.match(/\((.*?)\)/)[1]
        str = str.replace(link,'<a href="' + url + '" target="_blank">' + txt + '</a>')
      }
    }
    return str
  }

  const renderLinks = function(str) {
    // replace plain text links with anchor tags
    let urlList = str.match(/((http)s?:\/\/[^"'\s]+)(?![^<>]*>|[^"]*?<\/a)/g)
    if (urlList != null && urlList.length > 0){
      for (let urlTxt of urlList) {
        str = str.replace(urlTxt, '<a href="' + urlTxt + '" target="_blank">' + urlTxt + '</a>')
      }
    }
    return str
  }

  const replaceMarkdownBold = function(str) {
    // Replace markdown bold with html bold
    let markdownBold = str.match(/\*\*.*?\*\*/g)
    if (markdownBold != null && markdownBold.length > 0){
      for (let bold of markdownBold) {
        str = str.replace('**', '<b>')
        str = str.replace('**', '</b>')
      }
    }
    return str
  }

  const formatDate = function(str) {
    // format date time
    let dateTimeStr = str.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([Z]?)/g)
    if (dateTimeStr != null && dateTimeStr.length > 0){
      for (let dateTime of dateTimeStr) {
        let date = dateTime.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)
        let time = dateTime.match(/[0-9]{2}:[0-9]{2}:[0-9]{2}/)
        str = str.replace(dateTime, date + ', ' + time + ' UTC')
      }
    }
    return str
  }

  const formatMarkdownListItems = function(str) {
    // Add line breaks between markdown list item
    let markdownListItems = str.match(/(?<![\*]+)(\*)([^\*])+/g)
    if (markdownListItems != null && markdownListItems.length > 0){
      for (let listItem of markdownListItems) {
        str = str.replace(listItem, '<br>' + listItem)
      }
    }
    return str
  }

  const formatImgURL = function(str) {
    // Add line breaks between markdown list item
    let re = /(?<!(href=['"]))((http)s?:\/\/[^"'\s]+\.(jpg|jpeg|png|gif|bmp|svg|JPG|JPEG|PNG|GIF|BMP|SVG))/g
    let imgURLList = str.match(re)
    if (imgURLList != null && imgURLList.length > 0){
      for (let imgURL of imgURLList) {
        let fileName = imgURL.match(/[^"'\/\s]+\.(jpg|jpeg|png|gif|bmp|svg|JPG|JPEG|PNG|GIF|BMP|SVG)/)
        str = str.replace(re, '<img src="' + imgURL + '" alt="' + fileName[0] + '" width="200" />')
      }
    }
    return str
  }

  return {
    filteredRows, searchText, searchTextLowered,
    currentSortDir, currentSort, sortDir, sortIconClass, 
    pageSize, currentPage, paginatedRows, prevPage, nextPage,
    showingFilterText, showingFilteredFromText,
    truncateStripTags, stripTags, truncate, linkToRow,
    stringifyObj, formatString, replaceNewLine, replaceMarkdownLinks,
    renderLinks, replaceMarkdownBold, formatDate,
    formatMarkdownListItems
  }
}
